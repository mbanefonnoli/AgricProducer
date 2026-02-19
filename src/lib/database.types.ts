export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            producers: {
                Row: {
                    id: string
                    name: string
                    surname: string | null
                    company_name: string | null
                    produce: string | null
                    role: string | null
                    num_employees: number | null
                    location: string | null
                    additional_details: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    name: string
                    surname?: string | null
                    company_name?: string | null
                    produce?: string | null
                    role?: string | null
                    num_employees?: number | null
                    location?: string | null
                    additional_details?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    surname?: string | null
                    company_name?: string | null
                    produce?: string | null
                    role?: string | null
                    num_employees?: number | null
                    location?: string | null
                    additional_details?: string | null
                    created_at?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    producer_id: string
                    name: string
                    email: string | null
                    phone: string | null
                    details: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    producer_id: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    details?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    producer_id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    details?: string | null
                    created_at?: string
                }
            }
            inventory: {
                Row: {
                    id: string
                    producer_id: string
                    product_name: string
                    quantity: number
                    unit: string
                    last_updated: string
                }
                Insert: {
                    id?: string
                    producer_id: string
                    product_name: string
                    quantity?: number
                    unit: string
                    last_updated?: string
                }
                Update: {
                    id?: string
                    producer_id?: string
                    product_name?: string
                    quantity?: number
                    unit?: string
                    last_updated?: string
                }
            }
            inventory_ledger: {
                Row: {
                    id: string
                    inventory_id: string
                    amount: number
                    reason: string
                    transaction_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    inventory_id: string
                    amount: number
                    reason: string
                    transaction_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    inventory_id?: string
                    amount?: number
                    reason?: string
                    transaction_id?: string | null
                    created_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    producer_id: string
                    type: 'income' | 'expense'
                    category: string
                    amount: number
                    description: string | null
                    client_id: string | null
                    inventory_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    producer_id: string
                    type: 'income' | 'expense'
                    category: string
                    amount: number
                    description?: string | null
                    client_id?: string | null
                    inventory_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    producer_id?: string
                    type?: 'income' | 'expense'
                    category?: string
                    amount?: number
                    description?: string | null
                    client_id?: string | null
                    inventory_id?: string | null
                    created_at?: string
                }
            }
            documents: {
                Row: {
                    id: string
                    producer_id: string
                    client_id: string | null
                    name: string
                    file_path: string
                    type: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    producer_id: string
                    client_id?: string | null
                    name: string
                    file_path: string
                    type?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    producer_id?: string
                    client_id?: string | null
                    name?: string
                    file_path?: string
                    type?: string | null
                    created_at?: string
                }
            }
        }
    }
}
