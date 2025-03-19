// src/types/index.ts

export interface HarborProject {
    id: string;
    name: string;
    // 其他项目相关的属性
}

export interface HarborUser {
    id: string;
    username: string;
    // 其他用户相关的属性
}

export interface ApiResponse<T> {
    data: T;
    message: string;
    status: number;
}