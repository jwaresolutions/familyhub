import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["BACKLOG", "TODO", "IN_PROGRESS", "DONE"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    category: z.ZodEnum<["FAMILY", "WORK", "APARTMENT", "HOUSE", "BOAT"]>;
    dueDate: z.ZodOptional<z.ZodString>;
    assigneeIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    category: "FAMILY" | "WORK" | "APARTMENT" | "HOUSE" | "BOAT";
    description?: string | undefined;
    status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dueDate?: string | undefined;
    assigneeIds?: string[] | undefined;
}, {
    title: string;
    category: "FAMILY" | "WORK" | "APARTMENT" | "HOUSE" | "BOAT";
    description?: string | undefined;
    status?: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    dueDate?: string | undefined;
    assigneeIds?: string[] | undefined;
}>;
export declare const moveTaskSchema: z.ZodObject<{
    status: z.ZodEnum<["BACKLOG", "TODO", "IN_PROGRESS", "DONE"]>;
    position: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";
    position: number;
}, {
    status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";
    position: number;
}>;
export declare const reorderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        position: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        position: number;
    }, {
        id: string;
        position: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        id: string;
        position: number;
    }[];
}, {
    items: {
        id: string;
        position: number;
    }[];
}>;
export declare const createEventSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    startTime: z.ZodString;
    endTime: z.ZodString;
    allDay: z.ZodOptional<z.ZodBoolean>;
    userId: z.ZodString;
    taskId: z.ZodOptional<z.ZodString>;
    recurrenceRule: z.ZodOptional<z.ZodString>;
    recurrenceEnd: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    title: string;
    startTime: string;
    endTime: string;
    description?: string | undefined;
    allDay?: boolean | undefined;
    taskId?: string | undefined;
    recurrenceRule?: string | undefined;
    recurrenceEnd?: string | undefined;
}, {
    userId: string;
    title: string;
    startTime: string;
    endTime: string;
    description?: string | undefined;
    allDay?: boolean | undefined;
    taskId?: string | undefined;
    recurrenceRule?: string | undefined;
    recurrenceEnd?: string | undefined;
}>;
export declare const createShoppingListSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const createShoppingItemSchema: z.ZodObject<{
    productName: z.ZodString;
    quantity: z.ZodOptional<z.ZodNumber>;
    unit: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    storeIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    productName: string;
    quantity?: number | undefined;
    unit?: string | undefined;
    notes?: string | undefined;
    storeIds?: string[] | undefined;
}, {
    productName: string;
    quantity?: number | undefined;
    unit?: string | undefined;
    notes?: string | undefined;
    storeIds?: string[] | undefined;
}>;
export declare const checkItemSchema: z.ZodObject<{
    price: z.ZodOptional<z.ZodNumber>;
    storeId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    price?: number | undefined;
    storeId?: string | undefined;
}, {
    price?: number | undefined;
    storeId?: string | undefined;
}>;
export declare const createStoreSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const createSavedStopSchema: z.ZodObject<{
    stopId: z.ZodString;
    stopName: z.ZodString;
    routeIds: z.ZodArray<z.ZodString, "many">;
    nickname: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    stopId: string;
    stopName: string;
    routeIds: string[];
    nickname?: string | undefined;
}, {
    stopId: string;
    stopName: string;
    routeIds: string[];
    nickname?: string | undefined;
}>;
//# sourceMappingURL=validation.d.ts.map