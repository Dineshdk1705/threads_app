import mongoose from 'mongoose';

let isConnected = false;

export const connectToDB = async () => {
    mongoose.set('strictQuery', true);

    if (!process.env.MONGODB_URL) return console.log('MONGODB URL not found!');
    if (isConnected) return console.log('MONGO DB already connected!');

    try {
        await mongoose.connect(process.env.MONGODB_URL);
        isConnected = true;

        console.log("MongoDB connected successfully🥳")
    } catch (error) {
        console.log("MongoDB connection error : ", error);
    }
}