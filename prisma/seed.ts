
import { PrismaClient, Role, GstType } from '@prisma/client';
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
  const pharmacist2 = await prisma.user.upsert({
    where: { username: 'pharmacist2' },
    update: {},
    create: {
      username: 'pharmacist2',
      passwordHash: await bcrypt.hash('Pharma@123', 10),
      fullName: 'Second Pharmacist',
      role: Role.PHARMACIST,
    },
  });

  // hsnCode is no longer unique on Product, so upsert-by-hsnCode won't work.
  // Use findFirst + create instead (fine for dev seeding).
  const products = [
    {
      name: 'Dolo 650 Tablet',
      genericName: 'Paracetamol 650 mg',
      manufacturer: 'Micro Labs',
      category: 'Medicines',
      barcode: '8901234500011',
      hsnCode: '30049099',
      gstPercentage: 5,
      mrp: 35,
      cp: 28,
      sp: 35,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: true,
      batchNumber: 'DL650-001',
      expiryDate: '2028-06-30',
      quantity: 500,
    },
    {
      name: 'Crocin Advance',
      genericName: 'Paracetamol 500 mg',
      manufacturer: 'GSK',
      category: 'Medicines',
      barcode: '8901234500012',
      hsnCode: '30049099',
      gstPercentage: 12,
      mrp: 30,
      cp: 24,
      sp: 30,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: false,
      batchNumber: 'CRC500-001',
      expiryDate: '2028-05-31',
      quantity: 400,
    },
    {
      name: 'Augmentin 625',
      genericName: 'Amoxicillin + Clavulanic Acid',
      manufacturer: 'GSK',
      category: 'Medicines',
      barcode: '8901234500013',
      hsnCode: '30041020',
      gstPercentage: 18,
      mrp: 210,
      cp: 172,
      sp: 210,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: true,
      batchNumber: 'AUG625-001',
      expiryDate: '2027-12-31',
      quantity: 250,
    },
    {
      name: 'Pantocid 40',
      genericName: 'Pantoprazole 40 mg',
      manufacturer: 'Sun Pharma',
      category: 'Medicines',
      barcode: '8901234500014',
      hsnCode: '30049099',
      gstPercentage: 12,
      mrp: 165,
      cp: 132,
      sp: 165,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: true,
      batchNumber: 'PAN40-001',
      expiryDate: '2028-04-30',
      quantity: 300,
    },
    {
      name: 'Shelcal 500',
      genericName: 'Calcium + Vitamin D3',
      manufacturer: 'Torrent Pharma',
      category: 'Health & Nutrition',
      barcode: '8901234500015',
      hsnCode: '21069099',
      gstPercentage: 5,
      mrp: 145,
      cp: 116,
      sp: 145,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: false,
      batchNumber: 'SHL500-001',
      expiryDate: '2028-08-31',
      quantity: 350,
    },
    {
      name: 'Azithral 500',
      genericName: 'Azithromycin 500 mg',
      manufacturer: 'Alembic Pharma',
      category: 'Medicines',
      barcode: '8901234500016',
      hsnCode: '30042011',
      gstPercentage: 18,
      mrp: 118,
      cp: 94,
      sp: 118,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: true,
      batchNumber: 'AZI500-001',
      expiryDate: '2027-11-30',
      quantity: 220,
    },
    {
      name: 'Allegra 120',
      genericName: 'Fexofenadine 120 mg',
      manufacturer: 'Sanofi',
      category: 'Medicines',
      barcode: '8901234500017',
      hsnCode: '30049099',
      gstPercentage: 12,
      mrp: 245,
      cp: 198,
      sp: 245,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: false,
      batchNumber: 'ALG120-001',
      expiryDate: '2028-03-31',
      quantity: 180,
    },
    {
      name: 'Limcee 500',
      genericName: 'Vitamin C 500 mg',
      manufacturer: 'Abbott',
      category: 'Health & Nutrition',
      barcode: '8901234500018',
      hsnCode: '21069099',
      gstPercentage: 5,
      mrp: 30,
      cp: 24,
      sp: 30,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: false,
      batchNumber: 'LMC500-001',
      expiryDate: '2028-10-31',
      quantity: 450,
    },
    {
      name: 'Becosules Capsule',
      genericName: 'Vitamin B Complex',
      manufacturer: 'Pfizer',
      category: 'Health & Nutrition',
      barcode: '8901234500019',
      hsnCode: '21069099',
      gstPercentage: 0,
      mrp: 52,
      cp: 42,
      sp: 52,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: false,
      batchNumber: 'BEC001',
      expiryDate: '2028-09-30',
      quantity: 300,
    },
    {
      name: 'Telma 40',
      genericName: 'Telmisartan 40 mg',
      manufacturer: 'Glenmark',
      category: 'Medicines',
      barcode: '8901234500020',
      hsnCode: '30049099',
      gstPercentage: 12,
      mrp: 182,
      cp: 146,
      sp: 182,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: true,
      batchNumber: 'TEL40-001',
      expiryDate: '2028-07-31',
      quantity: 200,
    },
    {
      name: 'ORS Powder',
      genericName: 'Oral Rehydration Salts',
      manufacturer: 'Cipla',
      category: 'Health & Nutrition',
      barcode: '8901234500021',
      hsnCode: '30049099',
      gstPercentage: 0,
      mrp: 22,
      cp: 18,
      sp: 22,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: false,
      batchNumber: 'ORS001',
      expiryDate: '2028-12-31',
      quantity: 500,
    },
    {
      name: 'Digital Thermometer',
      genericName: 'Digital Thermometer',
      manufacturer: 'Dr Trust',
      category: 'Medical Supplies & Devices',
      barcode: '8901234500022',
      hsnCode: '90251990',
      gstPercentage: 18,
      mrp: 299,
      cp: 240,
      sp: 299,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: false,
      batchNumber: 'THERMO001',
      expiryDate: '2032-12-31',
      quantity: 100,
    },
    {
      name: 'Hand Sanitizer 500ml',
      genericName: 'Alcohol Based Sanitizer',
      manufacturer: 'Dettol',
      category: 'Personal & Baby Care',
      barcode: '8901234500023',
      hsnCode: '38089400',
      gstPercentage: 18,
      mrp: 180,
      cp: 145,
      sp: 180,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: false,
      batchNumber: 'SAN500',
      expiryDate: '2029-06-30',
      quantity: 250,
    },
    {
      name: 'Surgical Gloves',
      genericName: 'Latex Examination Gloves',
      manufacturer: 'Surgicare',
      category: 'Medical Supplies & Devices',
      barcode: '8901234500024',
      hsnCode: '40151900',
      gstPercentage: 12,
      mrp: 120,
      cp: 95,
      sp: 120,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: false,
      batchNumber: 'GLV001',
      expiryDate: '2030-12-31',
      quantity: 300,
    },
    {
      name: 'Cotton Roll',
      genericName: 'Absorbent Cotton',
      manufacturer: 'Johnson & Johnson',
      category: 'Medical Supplies & Devices',
      barcode: '8901234500025',
      hsnCode: '56012100',
      gstPercentage: 5,
      mrp: 55,
      cp: 42,
      sp: 55,
      gstType: GstType.INCLUSIVE,
      prescriptionRequired: false,
      batchNumber: 'COT001',
      expiryDate: '2031-12-31',
      quantity: 400,
    },
  ];

  for (const item of products) {
    const exists = await prisma.product.findFirst({
      where: {
        barcode: item.barcode,
      },
    });

    if (exists) {
      console.log(`${item.name} already exists`);
      continue;
    }

    await prisma.product.create({
      data: {
        name: item.name,
        genericName: item.genericName,
        manufacturer: item.manufacturer,

        category: {
          connectOrCreate: {
            where: {
              name: item.category,
            },
            create: {
              name: item.category,
            },
          },
        },

        barcode: item.barcode,
        hsnCode: item.hsnCode,

        gstPercentage: item.gstPercentage,

        mrp: item.mrp,
        cp: item.cp,
        sp: item.sp,

        gstType: item.gstType,

        prescriptionRequired: item.prescriptionRequired,

        batches: {
          create: {
            batchNumber: item.batchNumber,
            expiryDate: new Date(item.expiryDate),
            purchasePrice: item.cp,
            mrp: item.mrp,
            sellingPrice: item.sp,
            quantityAvailable: item.quantity,
          },
        },
      },
    });

    console.log(`${item.name} created`);
  }

  console.log(`Seeded ${products.length} products.`);
  console.log({
    admin: admin.username,
    pharmacist: pharmacist.username,
    pharmacist2: pharmacist2.username
    // paracetamol: paracetamol.name,
    // amoxicillin: amoxicillin.name,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });