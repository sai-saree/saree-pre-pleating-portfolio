import { google } from "googleapis";
import prisma from "./prisma.js";

/**
 * Get an authenticated Google Drive client using a service account.
 * Requires GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY env vars.
 */
function getDriveClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.warn("[DRIVE WARNING] Google credentials are not set. Running in simulation mode.");
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Share a Google Drive folder with a user (reader access).
 * @param {string} folderId - Google Drive folder ID
 * @param {string} email - user's email to grant access to
 * @returns {Promise<{ permissionId: string }>} - the permission ID
 */
export async function grantDriveAccess(folderId, email) {
  const drive = getDriveClient();
  if (!drive) {
    // Return a mock permission ID for development simulation
    return { permissionId: `mock-perm-${Date.now()}` };
  }

  const permission = await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      role: "reader",
      type: "user",
      emailAddress: email,
    },
    sendNotificationEmail: false,
  });

  return { permissionId: permission.data.id };
}

/**
 * Revoke a user's access to a Google Drive folder.
 * @param {string} folderId - Google Drive folder ID
 * @param {string} permissionId - the permission ID
 */
export async function revokeDriveAccess(folderId, permissionId) {
  const drive = getDriveClient();
  if (!drive) {
    console.log(`[DRIVE SIMULATION] Revoked permission ${permissionId} on folder ${folderId}`);
    return;
  }

  try {
    await drive.permissions.delete({
      fileId: folderId,
      permissionId: permissionId,
    });
    console.log(`Successfully revoked permission ${permissionId} from folder ${folderId}`);
  } catch (err) {
    console.error(`Failed to revoke drive permission: ${err.message}`);
  }
}

/**
 * Lazy Revocation Check
 * Scans for any active Drive permissions that have expired, deletes them from Google Drive,
 * and sets `has_drive_access` to false in the database.
 * This is called during common queries (like view registrations or getting recordings) to avoid cronjobs.
 */
export async function checkAndRevokeExpiredAccess() {
  try {
    const now = new Date();
    
    // Find all registrations where access is currently granted but expired
    const expiredRegs = await prisma.registrations.findMany({
      where: {
        has_drive_access: true,
        drive_access_expiry: {
          lt: now
        }
      },
      include: {
        event: true
      }
    });

    if (expiredRegs.length === 0) return;

    console.log(`[LAZY REVOCATION] Found ${expiredRegs.length} expired registrations. Revoking...`);

    for (const reg of expiredRegs) {
      // 1. Revoke on Google Drive (if folder ID and permission ID exist)
      if (reg.event.drive_folder_id && reg.drive_permission_id) {
        await revokeDriveAccess(reg.event.drive_folder_id, reg.drive_permission_id);
      }

      // 2. Update database to revoke access (change has_drive_access to false)
      await prisma.registrations.update({
        where: {
          user_id_event_id: {
            user_id: reg.user_id,
            event_id: reg.event_id
          }
        },
        data: {
          has_drive_access: false,
          drive_permission_id: null
        }
      });
      
      console.log(`[LAZY REVOCATION] Revoked access for user ID ${reg.user_id} on event ID ${reg.event_id}`);
    }
  } catch (err) {
    console.error("Error during checkAndRevokeExpiredAccess:", err);
  }
}
