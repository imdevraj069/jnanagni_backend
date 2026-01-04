import { Router } from "express";
import crypto from "crypto";
import user from "../models/user.model.js";

export const seedRouter = Router();

// Data pools for generating diverse users
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Reyansh', 'Kiaan', 'Aadhya', 'Ananya', 'Pari', 'Aanya',
  'Diya', 'Navya', 'Myra', 'Sara', 'Anika', 'Riya', 'Ira', 'Prisha', 'Saanvi', 'Avni',
  'Rohan', 'Kunal', 'Raj', 'Amit', 'Vikram', 'Rahul', 'Ravi', 'Suresh', 'Ramesh', 'Karan',
  'Pooja', 'Neha', 'Priya', 'Shreya', 'Megha', 'Kavya', 'Simran', 'Tanvi', 'Aditi', 'Sakshi',
  'Dev', 'Harsh', 'Nikhil', 'Siddharth', 'Varun', 'Yash', 'Akash', 'Ayush', 'Dhruv', 'Gaurav',
  'Anjali', 'Divya', 'Ishita', 'Khushi', 'Mansi', 'Nidhi', 'Pallavi', 'Ritika', 'Sneha', 'Tanya',
  'Aryan', 'Kartik', 'Mohit', 'Naman', 'Pratik', 'Rohit', 'Sahil', 'Shubham', 'Tushar', 'Utkarsh',
  'Bhavya', 'Chaitanya', 'Daksh', 'Eklavya', 'Faizaan', 'Hitesh', 'Jatin', 'Lakshay', 'Mayank', 'Nakul',
  'Rishi', 'Sameer', 'Tanmay', 'Uday', 'Vedant', 'Yuvraj', 'Zaid', 'Aarushi', 'Bhavna', 'Deepika'
];

const lastNames = [
  'Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Gupta', 'Jain', 'Agarwal', 'Reddy', 'Rao',
  'Mishra', 'Pandey', 'Tiwari', 'Dubey', 'Shukla', 'Chopra', 'Kapoor', 'Malhotra', 'Mehta', 'Sethi',
  'Bansal', 'Goyal', 'Jindal', 'Mittal', 'Garg', 'Saxena', 'Khanna', 'Bhatia', 'Arora', 'Grover',
  'Chauhan', 'Rathore', 'Rajput', 'Thakur', 'Bisht', 'Negi', 'Rawat', 'Bhatt', 'Joshi', 'Upadhyay',
  'Desai', 'Shah', 'Modi', 'Trivedi', 'Joshi', 'Parekh', 'Doshi', 'Gandhi', 'Thakkar', 'Vora',
  'Iyer', 'Menon', 'Nair', 'Pillai', 'Krishnan', 'Swamy', 'Bhat', 'Hegde', 'Shenoy', 'Kamath',
  'Choudhury', 'Das', 'Bose', 'Ghosh', 'Chatterjee', 'Mukherjee', 'Banerjee', 'Sen', 'Roy', 'Dey',
  'Khan', 'Ahmed', 'Ali', 'Hussain', 'Siddiqui', 'Ansari', 'Shaikh', 'Malik', 'Qureshi', 'Rizvi',
  'Naidu', 'Varma', 'Prasad', 'Murthy', 'Yadav', 'Chand', 'Devi', 'Lal', 'Sinha', 'Pathak'
];

const colleges = [
  'Graphic Era (Deemed to be University)',
  'Graphic Era Hill University',
  'IIT Roorkee',
  'NIT Uttarakhand',
  'DIT University',
  'UPES Dehradun',
  'IIT Delhi',
  'IIT Bombay',
  'BITS Pilani',
  'NIT Trichy',
  'VIT Vellore',
  'Manipal Institute of Technology',
  'SRM Institute of Science and Technology',
  'Delhi Technological University',
  'NSUT Delhi',
  'Thapar Institute of Engineering',
  'PEC Chandigarh',
  'Amity University',
  'Chitkara University',
  'LPU Jalandhar',
  'Shiv Nadar University',
  'Ashoka University',
  'IIIT Delhi',
  'IIIT Hyderabad',
  'IIIT Allahabad',
  'Anna University',
  'Jadavpur University',
  'Pune University',
  'Bangalore University',
  'Mumbai University'
];

const branches = [
  'Computer Science Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biotechnology',
  'Computer Science and AI',
  'Data Science',
  'Cyber Security',
  'Software Engineering',
  'Cloud Computing',
  'IoT',
  'Robotics',
  'Electronics and Instrumentation',
  'Production Engineering',
  'Industrial Engineering',
  'Automobile Engineering',
  'Petroleum Engineering',
  'Mining Engineering',
  'Environmental Engineering',
  'Agricultural Engineering',
  'Food Technology'
];

const campuses = ['FET', 'University', 'KGC', 'null', ''];
const roles = ['student', 'gkvian', 'fetian', 'faculty'];

// Helper functions
const generateJnanagniId = () => {
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `JGN26-${suffix}`;
};

const randomElement = (array) => array[Math.floor(Math.random() * array.length)];

const generatePhoneNumber = () => {
  const prefixes = ['98', '97', '96', '95', '94', '93', '92', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '70'];
  const prefix = randomElement(prefixes);
  const restDigits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + restDigits;
};

const generateEmail = (firstName, lastName, index) => {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com', 'icloud.com'];
  const separators = ['', '.', '_', ''];
  const separator = randomElement(separators);
  const number = Math.random() > 0.5 ? Math.floor(Math.random() * 999) : '';
  return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${number}${index}@${randomElement(domains)}`;
};

const generatePassword = () => 'Pass@1234';

// Seed Users Route
seedRouter.get("/users", async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 100;
    
    console.log('\n' + '='.repeat(70));
    console.log(`🌱 JNANAGNI USER SEEDER STARTED`);
    console.log(`Target: ${count} users`);
    console.log('='.repeat(70));
    
    // Fetch existing users
    console.log('\n🔍 Fetching existing users from database...');
    const existingUsers = await user.find({}, { email: 1, jnanagniId: 1 });
    
    const usedEmails = new Set();
    const usedJnanagniIds = new Set();
    existingUsers.forEach(u => {
      if (u.email) usedEmails.add(u.email);
      if (u.jnanagniId) usedJnanagniIds.add(u.jnanagniId);
    });

    console.log(`📊 Found ${existingUsers.length} existing users in database`);
    console.log(`\n📝 PREPARING ${count} USERS...`);
    
    const users = [];
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < count; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const name = `${firstName} ${lastName}`;
      
      // Generate unique email
      let email;
      let attempts = 0;
      do {
        email = generateEmail(firstName, lastName, i + Date.now() + attempts);
        attempts++;
      } while (usedEmails.has(email) && attempts < 10);
      
      if (usedEmails.has(email)) {
        skipCount++;
        continue;
      }
      usedEmails.add(email);

      // Generate unique Jnanagni ID
      let jnanagniId;
      let idAttempts = 0;
      do {
        jnanagniId = generateJnanagniId();
        idAttempts++;
      } while (usedJnanagniIds.has(jnanagniId) && idAttempts < 100);
      
      if (usedJnanagniIds.has(jnanagniId)) {
        skipCount++;
        continue;
      }
      usedJnanagniIds.add(jnanagniId);

      const contactNo = generatePhoneNumber();
      const whatsappNo = Math.random() > 0.3 ? contactNo : generatePhoneNumber();
      const password = generatePassword();
      const college = randomElement(colleges);
      const branch = randomElement(branches);
      const campus = randomElement(campuses);
      const role = randomElement(roles);
      const isVerified = Math.random() > 0.3;
      
      // Payment status distribution
      const paymentStatuses = ['none', 'pending', 'verified', 'failed'];
      const weights = [0.4, 0.2, 0.3, 0.1];
      let paymentStatus = 'none';
      const rand = Math.random();
      if (rand < weights[0]) paymentStatus = 'none';
      else if (rand < weights[0] + weights[1]) paymentStatus = 'pending';
      else if (rand < weights[0] + weights[1] + weights[2]) paymentStatus = 'verified';
      else paymentStatus = 'failed';

      const userData = {
        name,
        email,
        contactNo,
        whatsappNo,
        college,
        branch,
        campus,
        password,
        role,
        jnanagniId,
        isVerified,
        paymentStatus,
        specialRoles: ['None']
      };

      users.push(userData);
      successCount++;

      // Log progress every 50 users
      if ((i + 1) % 50 === 0) {
        console.log(`   ✅ Prepared ${i + 1}/${count} users...`);
      }
    }

    console.log(`\n✅ Preparation complete! ${users.length} users ready for insertion`);
    console.log(`\n💾 INSERTING USERS INTO DATABASE...`);
    
    // Insert in batches
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(users.length / batchSize);
      
      try {
        await user.insertMany(batch, { ordered: false });
        insertedCount += batch.length;
        console.log(`   ✅ Batch ${batchNum}/${totalBatches} inserted (${insertedCount}/${users.length} users)`);
      } catch (error) {
        if (error.code === 11000) {
          const successfulInserts = error.result?.result?.nInserted || 0;
          insertedCount += successfulInserts;
          console.log(`   ⚠️  Batch ${batchNum}/${totalBatches} partially inserted: ${successfulInserts} users (duplicates skipped)`);
        } else {
          throw error;
        }
      }
    }

    const totalUsers = await user.countDocuments();

    console.log('\n' + '='.repeat(70));
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log(`✅ Successfully inserted: ${insertedCount} users`);
    console.log(`⚠️  Skipped: ${successCount - insertedCount} users`);
    console.log(`📊 Total users in database: ${totalUsers}`);
    console.log('='.repeat(70) + '\n');

    res.status(200).json({
      success: true,
      message: "Users seeded successfully",
      data: {
        requestedCount: count,
        successfullyInserted: insertedCount,
        skipped: successCount - insertedCount,
        totalUsersInDatabase: totalUsers
      }
    });

  } catch (error) {
    console.error("❌ Error seeding users:", error);
    res.status(500).json({
      success: false,
      message: "Error seeding users",
      error: error.message
    });
  }
});

// Health check
seedRouter.get("/", (req, res) => {
  res.status(200).json({ 
    message: "Seed API is working",
    endpoints: {
      "GET /api/v1/seed/users?count=100": "Seed users to database. count parameter is optional (default: 100)"
    }
  });
});
