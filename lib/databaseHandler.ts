import { User } from "./interfaces.js";

export interface DataBaseResponse<T> {
    success: boolean,
    data?: T,
    error?: any
}

export class DatabaseHandler {
    private db: any;

    constructor(db: any) {
        this.db = db;
    }

    // Methods

    async getUserByID(id: string): Promise<DataBaseResponse<User>> {
        try {
            const user = await this.db.collection("users").findOne({ id });
            if (user) {
                return { success: true, data: user };
            } else {
                return { success: false, error: "User not found" };
            }
        } catch (error) {
            console.log(error);
            return { success: false, error: error };
        }
    }

    async getUser(account: string, field: string, value: string): Promise<DataBaseResponse<User>> {
        try {
            const user = await this.db.collection("users").findOne({ [`${account}.${field}`]: value });
            if (user) {
                return { success: true, data: user };
            } else {
                return { success: false, error: "User not found" };
            }
        } catch (error) {
            console.log(error);
            return { success: false, error: error };
        }
    }

    async updateUser(id: string, data: any): Promise<DataBaseResponse<User>> {
        try {
            const user = (await this.db.collection("users").findOneAndUpdate({ id }, { $set: data }, { returnOriginal: false })).value;
            if (user) {
                return { success: true, data: user };
            } else {
                return { success: false, error: "User not found" };
            }
        } catch (error) {
            console.log(error);
            return { success: false, error: error };
        }
    }

    async deleteUser(id: string): Promise<DataBaseResponse<User>> {
        try {
            const user = (await this.db.collection("users").findOneAndDelete({ id })).value;
            if (user) {
                return { success: true, data: user };
            } else {
                return { success: false, error: "User not found" };
            }
        } catch (error) {
            console.log(error);
            return { success: false, error: error };
        }
    }
}