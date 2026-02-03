// src/env.d.ts
declare namespace App {
    interface Locals {
        user?: {
            id: number;
            nick: string;
            permissions: number[];
            agenciaId?: string;
        };
    }
}