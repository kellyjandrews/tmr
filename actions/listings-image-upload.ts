// actions/listings-image-upload.ts
'use server';

import { createSession } from '@/utils/supabase/serverSide';
import type { ActionResponse } from '@/types/common';

/**
 * Interface for upload URL response
 */
interface UploadUrlResponse {
    upload_url: string;
    storage_path: string;
}

/**
 * Get a URL for uploading an image file
 */
export async function getListingImageUploadUrl(contentType: string): Promise<ActionResponse<UploadUrlResponse>> {
    const supabase = await createSession();

    try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Call the stored procedure to get a signed upload URL
        const { data, error } = await supabase.rpc('get_listing_image_upload_url', {
            user_id_param: userData.user.id,
            content_type: contentType
        });

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            return {
                success: false,
                error: 'Failed to generate upload URL'
            };
        }

        return {
            success: true,
            data: data[0] as UploadUrlResponse
        };
    } catch (error) {
        console.error('Error getting upload URL:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Upload an image file for a listing
 */
export async function uploadListingImage(file: File): Promise<ActionResponse<string>> {
    try {
        // Step 1: Get a signed upload URL
        const urlResult = await getListingImageUploadUrl(file.type);
        if (!urlResult.success || !urlResult.data) {
            return {
                success: false,
                error: urlResult.error || 'Failed to get upload URL'
            };
        }

        const { upload_url, storage_path } = urlResult.data;

        // Step 2: Upload the file to the signed URL
        const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type
            },
            body: file
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        // Step 3: Return the public URL for the uploaded file
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${storage_path}`;

        return {
            success: true,
            data: publicUrl,
            message: 'Image uploaded successfully'
        };
    } catch (error) {
        console.error('Error uploading image:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Delete an image file for a listing
 */
export async function deleteListingImage(imageUrl: string): Promise<ActionResponse<boolean>> {
    const supabase = await createSession();

    try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Extract the storage path from the URL
        const urlObj = new URL(imageUrl);
        const pathParts = urlObj.pathname.split('/');
        const storagePath = pathParts.slice(pathParts.indexOf('listing-images') + 1).join('/');

        // Check if user has permission to delete this image
        const { data: canDelete, error: permissionError } = await supabase.rpc('can_delete_listing_image', {
            user_id_param: userData.user.id,
            image_path: storagePath
        });

        if (permissionError) throw new Error(permissionError.message);
        if (!canDelete) {
            return {
                success: false,
                error: 'You do not have permission to delete this image'
            };
        }

        // Delete the file from storage
        const { error: deleteError } = await supabase.storage
            .from('listing-images')
            .remove([storagePath]);

        if (deleteError) throw new Error(deleteError.message);

        return {
            success: true,
            data: true,
            message: 'Image deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting image:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}