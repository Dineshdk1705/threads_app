"use server"

import { connectToDB } from '../mongoose';
import Thread from '../models/thread.model';
import User from '../models/user.model';
import { revalidatePath } from 'next/cache';

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string
}

export const createThread = async ({
    text,
    author,
    communityId,
    path,
}: Params) => {
    connectToDB();

    try {
        const createdThread = await Thread.create({
            text,
            author,
            community: null,
        });

        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id },
        });

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Failed to create thread: ${error.message}`);
    }
}

export const fetchPosts = async (pageNumber = 1, pageSize = 20) => {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;

    try {
        const posts = await Thread.find({ parentId: { $in: [null, undefined] } })
            .sort({ createdAt: 'desc' })
            .skip(skipAmount)
            .limit(pageSize)
            .populate({ path: 'author', model: User })
            .populate({
                path: 'children',
                populate: {
                    path: 'author',
                    model: User,
                    select: "_id name parentId image"
                }
            })

        const totalPostCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } });

        // const posts = await postsQuery.exec();
        const isNext = totalPostCount > skipAmount + posts.length;

        return { posts, isNext };

    } catch (error: any) {
        throw new Error(`Failed to fetch posts: ${error.message}`);
    }
}

export const fetchThreadById = async (id: string) => {
    connectToDB();

    try {

        // Populate Community
        const thread = await Thread.findById(id)
            .populate({
                path: 'author',
                model: User,
                select: "_id id name image"
            })
            .populate({
                path: "children", // Populate the children field
                populate: [
                    {
                        path: "author", // Populate the author field within children
                        model: User,
                        select: "_id id name parentId image", // Select only _id and username fields of the author
                    },
                    {
                        path: "children", // Populate the children field within children
                        model: Thread, // The model of the nested children (assuming it's the same "Thread" model)
                        populate: {
                            path: "author", // Populate the author field within nested children
                            model: User,
                            select: "_id id name parentId image", // Select only _id and username fields of the author
                        },
                    },
                ],
            })

        return thread;

    } catch (error: any) {
        throw new Error(`Failed to fetch nested thread: ${error.message}`);
    }
}

export const addCommentToThread = async (
    threadId: string,
    commentText: string,
    userId: string,
    path: string
) => {
    connectToDB();

    try {
        const originalThread = await Thread.findById(threadId);
        if (!originalThread) {
            throw new Error('Thread not found');
        }

        const commentThread = new Thread({
            text: commentText,
            author: userId,
            parentId: threadId,
        })

        const savedCommentThread = await commentThread.save();

        originalThread.children.push(savedCommentThread._id);
        await originalThread.save();

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Failed to add comment to thread: ${error.message}`);
    }

}