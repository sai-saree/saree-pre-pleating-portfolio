import "dotenv/config";
import prisma from "./prisma.js";
import { generateCertificate } from "./certificate.js";
import { checkAndRevokeExpiredAccess } from "./google-drive.js";

async function runTests() {
  console.log("🚀 Starting End-to-End API Workflows Test...\n");

  const testEmail = `test_user_${Date.now()}@example.com`;
  let testUser;
  let testEvent;

  try {
    // 1. Create a Test User in DB
    console.log("Step 1: Creating test user...");
    testUser = await prisma.users.create({
      data: {
        name: "Test Participant",
        email: testEmail,
        phone: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        password: "hashedpassword123",
        role: "user",
      },
    });
    console.log(`✅ Created user: ${testUser.name} (${testUser.email})`);

    // 2. Create a Test Event in DB
    console.log("\nStep 2: Creating test event...");
    testEvent = await prisma.events.create({
      data: {
        title: "E2E Pre-Pleating Workshop",
        description: "A comprehensive test workshop",
        date: new Date(),
        time: "2:00 PM",
        location: "Virtual Studio",
        meet_link: "https://meet.google.com/xyz-pdq-abc",
        drive_folder_id: "1_test_drive_folder_id_xyz",
      },
    });
    console.log(`✅ Created event: "${testEvent.title}" (ID: ${testEvent.id})`);

    // 3. Register the User for the Event (Initial state: PENDING, PRESENT)
    console.log("\nStep 3: Registering user for event (Pending payment, marked Present)...");
    const registration = await prisma.registrations.create({
      data: {
        user_id: testUser.id,
        event_id: testEvent.id,
        payment_status: "PENDING",
        attendance_status: "PRESENT",
      },
    });
    console.log("✅ Created registration mapping in database.");

    // 4. Simulate Payment Approval
    console.log("\nStep 4: Simulating Payment Approval...");
    const approvedReg = await prisma.registrations.update({
      where: {
        user_id_event_id: {
          user_id: testUser.id,
          event_id: testEvent.id,
        },
      },
      data: {
        payment_status: "COMPLETED",
      },
    });
    console.log(`✅ Payment updated: ${approvedReg.payment_status}`);

    // 5. Generate and Send Certificate
    console.log("\nStep 5: Testing PDF Certificate Generation...");
    const pdfBytes = await generateCertificate({
      userName: testUser.name,
      eventTitle: testEvent.title,
      eventDate: testEvent.date.toISOString().split("T")[0],
    });
    console.log(`✅ PDF successfully generated. Size: ${pdfBytes.length} bytes.`);

    // Update DB to mark certificate as sent
    const certReg = await prisma.registrations.update({
      where: {
        user_id_event_id: {
          user_id: testUser.id,
          event_id: testEvent.id,
        },
      },
      data: {
        certificate_sent: true,
      },
    });
    console.log(`✅ Certificate marked as sent in DB: ${certReg.certificate_sent}`);

    // 6. Simulate Granting Google Drive Access (30 days expiration)
    console.log("\nStep 6: Simulating Google Drive sharing & set 30-day expiry...");
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days in future

    const driveReg = await prisma.registrations.update({
      where: {
        user_id_event_id: {
          user_id: testUser.id,
          event_id: testEvent.id,
        },
      },
      data: {
        has_drive_access: true,
        drive_permission_id: "mock-perm-id-12345",
        drive_access_expiry: expiryDate,
      },
    });
    console.log(`✅ Drive access granted. Expiry set to: ${driveReg.drive_access_expiry}`);

    // 7. Verify Active Access
    console.log("\nStep 7: Verifying active access status...");
    let checkedReg = await prisma.registrations.findUnique({
      where: {
        user_id_event_id: {
          user_id: testUser.id,
          event_id: testEvent.id,
        },
      },
    });
    console.log(`🔍 has_drive_access variable is: ${checkedReg.has_drive_access}`);

    // 8. Test Lazy Revocation (Force Expiry in DB and trigger check)
    console.log("\nStep 8: Testing Lazy Revocation (Manually setting expiration to 1 hour ago)...");
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1); // 1 hour in the past

    await prisma.registrations.update({
      where: {
        user_id_event_id: {
          user_id: testUser.id,
          event_id: testEvent.id,
        },
      },
      data: {
        drive_access_expiry: pastDate,
      },
    });

    console.log("Triggering checkAndRevokeExpiredAccess()...");
    await checkAndRevokeExpiredAccess();

    // Re-fetch registration to verify access is now false
    const finalReg = await prisma.registrations.findUnique({
      where: {
        user_id_event_id: {
          user_id: testUser.id,
          event_id: testEvent.id,
        },
      },
    });
    console.log(`🔍 has_drive_access variable is now: ${finalReg.has_drive_access}`);
    if (finalReg.has_drive_access === false) {
      console.log("\n🎉 SUCCESS: Google Drive access was auto-revoked after expiry!");
    } else {
      console.error("\n❌ FAILURE: Google Drive access was not revoked.");
    }

  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
  } finally {
    // Cleanup Database
    console.log("\n🧹 Cleaning up test data from database...");
    if (testUser || testEvent) {
      try {
        await prisma.registrations.deleteMany({
          where: {
            user_id: testUser?.id,
            event_id: testEvent?.id,
          },
        });
        if (testUser) {
          await prisma.users.delete({ where: { id: testUser.id } });
        }
        if (testEvent) {
          await prisma.events.delete({ where: { id: testEvent.id } });
        }
        console.log("✅ Cleanup successful.");
      } catch (cleanupErr) {
        console.error("Failed to clean up test data:", cleanupErr.message);
      }
    }
    await prisma.$disconnect();
    console.log("\n🏁 Tests finished.");
  }
}

runTests();
