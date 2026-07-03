import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      fullName: 'Store Admin',
      role: Role.ADMIN,
    },
  });

  const pharmacist = await prisma.user.upsert({
    where: { username: 'pharmacist' },
    update: {},
    create: {
      username: 'pharmacist',
      passwordHash: await bcrypt.hash('Pharma@123', 10),
      fullName: 'Default Pharmacist',
      role: Role.PHARMACIST,
    },
  });

  const paracetamol = await prisma.medicine.upsert({
    where: { hsnCode: '30049099' },
    update: {},
    create: {
      name: 'Paracetamol 500mg (Strip of 10)',
      manufacturer: 'Generic Pharma Ltd',
      category: 'Analgesic',
      barcode: '8901234567890',
      hsnCode: '30049099',
      gstPercentage: 12.0,
      prescriptionRequired: false,
      batches: {
        create: [
          {
            batchNumber: 'PCM-2026-01',
            expiryDate: new Date('2027-06-30'),
            purchasePrice: 8.5,
            sellingPrice: 12.0,
            quantityAvailable: 500,
          },
        ],
      },
    },
  });

  const amoxicillin = await prisma.medicine.upsert({
    where: { hsnCode: '30041020' },
    update: {},
    create: {
      name: 'Amoxicillin 250mg (Strip of 10)',
      manufacturer: 'MediCore Labs',
      category: 'Antibiotic',
      barcode: '8901234567906',
      hsnCode: '30041020',
      gstPercentage: 5.0,
      prescriptionRequired: true,
      batches: {
        create: [
          {
            batchNumber: 'AMX-2026-03',
            expiryDate: new Date('2027-01-31'),
            purchasePrice: 22.0,
            sellingPrice: 32.0,
            quantityAvailable: 200,
          },
        ],
      },
    },
  });

  console.log({ admin: admin.username, pharmacist: pharmacist.username, paracetamol: paracetamol.name, amoxicillin: amoxicillin.name });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
