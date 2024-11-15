"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";

interface Params {
    userId: string,
    name: string,
    image: string,
    username: string,
    bio: string,
    path: string,
}

export async function updateUser({
    userId,
    name,
    username,
    image,
    bio,
    path
}: Params): Promise<void> {
    connectToDB();

    try {
        await User.findOneAndUpdate(
            { id: userId },
            {
                username: username.toLowerCase(),
                name,
                image,
                bio,
                onboarded: true,
            },
            { upsert: true }
        )

        if (path === '/profile/edit') {
            revalidatePath(path);
        }
    } catch (error: any) {
        console.log(`Failed to create/update the user : ${error.message}`)
    }
}

export async function fetchUser(userId: string) {
    connectToDB();

    try {
        return await User.findOne({ id: userId })
        //     .populate({
        //     path: 'community',
        //     model: 'Community',
        // })
    } catch (error: any) {
        console.log(`Failed to get user : ${error.message}`)
    }
}

export const fetchUserPosts = async (userId: string) => {
    connectToDB();

    try {
        const threads = await User.findOne({ id: userId })
            .populate({
                path: 'threads',
                model: Thread,
                populate: {
                    path: 'children',
                    model: Thread,
                    populate: {
                        path: 'author',
                        model: User,
                        select: 'name image id',
                    }
                }
            })

        return threads;
    } catch (error: any) {
        console.log(`Failed to fetch user posts : ${error.message}`)
    }
}

export const fetchUsers = async ({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = 'desc',
}: {
    userId: string;
    searchString?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: SortOrder;
}) => {
    try {
        connectToDB();

        const skipAmount = (pageNumber - 1) * pageSize;
        const regex = new RegExp(searchString, 'i');

        const query: FilterQuery<typeof User> = {
            id: { $ne: userId }, // Exclude the current user from the results.
        };

        if (searchString.trim() !== "") {
            query.$or = [
                { username: { $regex: regex } },
                { name: { $regex: regex } }
            ]
        }

        const sortOptions = { createdAt: sortBy };

        const userQuery = User.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize)

        const totalUsersCount = await User.countDocuments(query);
        const users = await userQuery.exec();

        const isNext = totalUsersCount > skipAmount + users.length;
        return { users, isNext }

    } catch (error: any) {
        console.log(`Failed to fetchUser the user : ${error.message}`);
        throw error;
    }
}

export const getActivity = async (userId: string) => {
    try {
        connectToDB();

        // Find all threads created by the user
        const userThreads = await Thread.find({ author: userId });

        // Collect all the child thread ids (replies) from the 'children' field of each user thread
        const childThreadIds = userThreads.reduce((acc, userThread) => {
            return acc.concat(userThread.children);
        }, []);

        // Find and return the child threads (replies) excluding the ones created by the same user
        const replies = await Thread.find({
            _id: { $in: childThreadIds },
            author: { $ne: userId }, // Exclude threads authored by the same user
        }).populate({
            path: "author",
            model: User,
            select: "name image _id",
        });

        return replies;
    } catch (error) {
        console.error("Error fetching replies: ", error);
        throw error;
    }
}