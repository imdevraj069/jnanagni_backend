import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Import User model
import user from '../src/models/user.model.js';
import { connectDB } from '../src/configs/connectDB.js';

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

const generatePassword = () => {
  let password = 'Pass@1234';
  return password;
};

// Main seeding function
const seedUsers = async (count = 2000) => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully');

    console.log(`\n🌱 Starting to seed ${count} users...`);
    
    const users = [];
    const usedEmails = new Set();
    const usedJnanagniIds = new Set();
    
    // Get existing emails and IDs to avoid duplicates
    const existingUsers = await user.find({}, { email: 1, jnanagniId: 1 });
    existingUsers.forEach(u => {
      if (u.email) usedEmails.add(u.email);
      if (u.jnanagniId) usedJnanagniIds.add(u.jnanagniId);
    });

    console.log(`📊 Found ${existingUsers.length} existing users in database`);

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
        console.log(`⚠️  Skipping user ${i + 1}: Could not generate unique email`);
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
        console.log(`⚠️  Skipping user ${i + 1}: Could not generate unique Jnanagni ID`);
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
      
      // Randomly set verification status
      const isVerified = Math.random() > 0.3; // 70% verified
      
      // Randomly set payment status
      const paymentStatuses = ['none', 'pending', 'verified', 'failed'];
      const weights = [0.4, 0.2, 0.3, 0.1]; // 40% none, 20% pending, 30% verified, 10% failed
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

      // Log progress every 100 users
      if ((i + 1) % 100 === 0) {
        console.log(`📝 Prepared ${i + 1}/${count} users...`);
      }
    }

    console.log(`\n💾 Inserting ${users.length} users into database...`);
    
    // Insert in batches to avoid memory issues
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      try {
        await user.insertMany(batch, { ordered: false });
        insertedCount += batch.length;
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)} (${insertedCount} users)`);
      } catch (error) {
        // Handle duplicate key errors
        if (error.code === 11000) {
          const successfulInserts = error.result?.result?.nInserted || 0;
          insertedCount += successfulInserts;
          console.log(`⚠️  Batch ${Math.floor(i / batchSize) + 1} partially inserted: ${successfulInserts} users (some duplicates skipped)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 User seeding completed!');
    console.log('='.repeat(50));
    console.log(`✅ Successfully inserted: ${insertedCount} users`);
    console.log(`⚠️  Skipped: ${skipCount} users`);
    console.log(`📊 Total in database: ${await user.countDocuments()} users`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the seeding
const userCount = parseInt(process.argv[2]) || 2000;
console.log(`\n${'='.repeat(50)}`);
console.log(`🚀 JNANAGNI USER SEEDER`);
console.log(`${'='.repeat(50)}`);
console.log(`Target: ${userCount} users\n`);

seedUsers(userCount)
  .then(() => {
    console.log('\n✨ Seeding process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding process failed:', error.message);
    process.exit(1);
  });
