// src/env.d.ts
declare namespace App {
    interface Locals {
        user?: {
            id: number;
            nick: string;
            /** Array de ID_OPCION de SEG_PERMISO. Toda la autorización pasa por aquí. */
            permissions: number[];
            agenciaId?: string;
        };
    }
}