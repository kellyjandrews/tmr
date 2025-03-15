'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  PencilIcon, 
  EyeIcon, 
  EyeOff, 
  Trash2,
  CheckCircle2,
  Clock,
  Tag,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle
} from 'lucide-react';
import { changeListingStatus, deleteListing } from '@/actions/listings-manage';
import type { Listing } from '@/types/listing';

type ManageListingsClientProps = {
  initialListings: Listing[];
};

export default function ManageListingsClient({ initialListings }: ManageListingsClientProps) {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [filteredListings, setFilteredListings] = useState<Listing[]>(initialListings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Listing; direction: 'asc' | 'desc' }>({
    key: 'created_at',
    direction: 'desc'
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Apply filters and sorting whenever any of these values change
  useEffect(() => {
    let result = [...listings];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(listing => 
        listing.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(listing => listing.status === statusFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
     
      if (aValue === null || bValue === null) {
        return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredListings(result);
  }, [listings, searchTerm, statusFilter, sortConfig]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter
  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status === statusFilter ? null : status);
  };

  // Handle sorting
  const handleSort = (key: keyof Listing) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle delete listing
  const handleDeleteListing = async (id: string) => {
    // First show confirmation
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }

    setIsDeleting(id);
    setError(null);
    
    try {
      const result = await deleteListing(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete listing');
      }
      
      // Update listings state
      setListings(prev => prev.filter(listing => listing.id !== id));
      router.refresh();
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsDeleting(null);
      setConfirmDelete(null);
    }
  };

  // Handle change listing status
  const handleChangeStatus = async (id: string, status: 'draft' | 'active' | 'hidden' | 'sold') => {
    setStatusChanging(id);
    setError(null);
    
    try {
      const result = await changeListingStatus(id, status);
      
      if (!result.success) {
        throw new Error(result.error || `Failed to change listing status to ${status}`);
      }
      
      // Update listings state
      setListings(prev => 
        prev.map(listing => 
          listing.id === id ? { ...listing, status } : listing
        )
      );
      router.refresh();
    } catch (err) {
      console.error('Error changing listing status:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setStatusChanging(null);
    }
  };

  // Get status badge color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          icon: <Clock size={14} className="mr-1" /> 
        };
      case 'active':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: <CheckCircle2 size={14} className="mr-1" /> 
        };
      case 'hidden':
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: <EyeOff size={14} className="mr-1" /> 
        };
      case 'sold':
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          icon: <Tag size={14} className="mr-1" /> 
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: <AlertTriangle size={14} className="mr-1" /> 
        };
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button 
            type="button"
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter and search controls */}
      <div className="flex flex-col md:flex-row md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative md:w-1/3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            placeholder="Search listings..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="flex space-x-2">
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => handleStatusFilter('draft')}
              className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                statusFilter === 'draft'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Clock size={14} className="mr-1" />
              Draft
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilter('active')}
              className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                statusFilter === 'active'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CheckCircle2 size={14} className="mr-1" />
              Active
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilter('hidden')}
              className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                statusFilter === 'hidden'
                  ? 'bg-gray-100 text-gray-800 border-gray-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <EyeOff size={14} className="mr-1" />
              Hidden
            </button>
            <button
              type="button"
              onClick={() => handleStatusFilter('sold')}
              className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                statusFilter === 'sold'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Tag size={14} className="mr-1" />
              Sold
            </button>
          </div>
        </div>
      </div>

      {/* Listings table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Listing
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center">
                  Price
                  {sortConfig.key === 'price' && (
                    sortConfig.direction === 'asc'
                      ? <ChevronUp size={14} className="ml-1" />
                      : <ChevronDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center">
                  QTY
                  {sortConfig.key === 'quantity' && (
                    sortConfig.direction === 'asc'
                      ? <ChevronUp size={14} className="ml-1" />
                      : <ChevronDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Created
                  {sortConfig.key === 'created_at' && (
                    sortConfig.direction === 'asc'
                      ? <ChevronUp size={14} className="ml-1" />
                      : <ChevronDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredListings.map(listing => {
              const statusInfo = getStatusInfo(listing.status);
              
              return (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-purple-100 rounded-md overflow-hidden">
                        {listing.image_url ? (
                          <Image 
                            src={listing.image_url} 
                            alt={listing.name}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-purple-500">
                            <AlertTriangle size={20} />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {listing.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {listing.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${Number(listing.price).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{listing.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.icon}
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      {/* View button - only for active listings */}
                      {listing.status === 'active' && (
                        <Link 
                          href={`/listing/${listing.id}`}
                          target="_blank"
                          className="text-gray-600 hover:text-gray-900"
                          title="View listing"
                        >
                          <EyeIcon size={18} />
                        </Link>
                      )}
                      
                      {/* Edit button */}
                      <Link 
                        href={`/dashboard/sell/edit-listing/${listing.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit listing"
                      >
                        <PencilIcon size={18} />
                      </Link>
                      
                      {/* Status change buttons */}
                      <div className="relative group">
                        <button
                          type="button"
                          className="text-purple-600 hover:text-purple-900"
                          disabled={statusChanging === listing.id}
                          title="Change status"
                        >
                          {statusChanging === listing.id ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                          ) : (
                            <ArrowUpDown size={18} />
                          )}
                        </button>
                        
                        {/* Status dropdown menu */}
                        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block">
                          {listing.status !== 'draft' && (
                            <button
                              type="button"
                              onClick={() => handleChangeStatus(listing.id, 'draft')}
                              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Clock size={14} className="inline mr-2" />
                              Set as Draft
                            </button>
                          )}
                          {listing.status !== 'active' && (
                            <button
                              type="button"
                              onClick={() => handleChangeStatus(listing.id, 'active')}
                              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <CheckCircle2 size={14} className="inline mr-2" />
                              Publish
                            </button>
                          )}
                          {listing.status !== 'hidden' && (
                            <button
                              type="button"
                              onClick={() => handleChangeStatus(listing.id, 'hidden')}
                              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <EyeOff size={14} className="inline mr-2" />
                              Hide
                            </button>
                          )}
                          {listing.status !== 'sold' && (
                            <button
                              type="button"
                              onClick={() => handleChangeStatus(listing.id, 'sold')}
                              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Tag size={14} className="inline mr-2" />
                              Mark as Sold
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(listing.id)}
                        className={`${
                          confirmDelete === listing.id 
                            ? 'text-red-600 animate-pulse' 
                            : 'text-red-500 hover:text-red-700'
                        }`}
                        disabled={isDeleting === listing.id}
                        title={confirmDelete === listing.id ? "Click again to confirm" : "Delete listing"}
                      >
                        {isDeleting === listing.id ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredListings.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-500">No listings found with the current filters.</p>
        </div>
      )}
    </div>
  );
}