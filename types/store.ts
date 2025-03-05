// types/store.ts
export type Store = {
    id: string;
    user_id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
};

export type StoreFormData = {
    name: string;
    slug?: string;
};

// types/listing.ts
export type Listing = {
    id: string;
    store_id: string;
    name: string;
    description: string | null;
    price: number;
    created_at: string;
    updated_at: string;
};

export type ListingFormData = {
    name: string;
    description?: string;
    price: number;
};