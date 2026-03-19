export declare const TaskStatus: {
    readonly BACKLOG: "BACKLOG";
    readonly TODO: "TODO";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly DONE: "DONE";
};
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export declare const Priority: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly URGENT: "URGENT";
};
export type Priority = (typeof Priority)[keyof typeof Priority];
export declare const TaskCategory: {
    readonly FAMILY: "FAMILY";
    readonly WORK: "WORK";
    readonly APARTMENT: "APARTMENT";
    readonly HOUSE: "HOUSE";
    readonly BOAT: "BOAT";
};
export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    category: TaskCategory;
    position: number;
    dueDate?: string;
    assignees: {
        id: string;
        name: string;
        color: string;
    }[];
    createdAt: string;
    updatedAt: string;
}
export interface CreateTaskRequest {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    category: TaskCategory;
    dueDate?: string;
    assigneeIds?: string[];
}
export interface MoveTaskRequest {
    status: TaskStatus;
    position: number;
}
export interface ReorderRequest {
    items: {
        id: string;
        position: number;
    }[];
}
//# sourceMappingURL=task.d.ts.map