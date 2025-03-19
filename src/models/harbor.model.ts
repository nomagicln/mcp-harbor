// harbor.model.ts

export interface Project {
    id: string;
    name: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}

export interface User {
    id: string;
    username: string;
    email: string;
    created_at: Date;
    updated_at: Date;
}