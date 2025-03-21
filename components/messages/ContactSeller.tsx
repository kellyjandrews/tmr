'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { contactSeller } from '@/actions/messages';

type ContactSellerProps = {
  listingId: string;
  listingName: string;
  buttonText?: string;
  buttonFullWidth?: boolean;
  buttonClassName?: string;
};

export default function ContactSeller({
  listingId,
  listingName,
  buttonText = 'Contact Seller',
  buttonFullWidth = false,
  buttonClassName,
}: ContactSellerProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setIsModalOpen(true);
    // Pre-populate with a template message
    setMessage(`Hi, I'm interested in "${listingName}". Is this still available?`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMessage('');
    setError(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    try {
      setIsSending(true);
      setError(null);
      
      const result = await contactSeller(listingId, message.trim());
      
      if (result.success && result.data) {
        // Redirect to the conversation
        router.push(`/dashboard/messages/${result.data.conversation_id}`);
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error contacting seller:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSending(false);
    }
  };

  const defaultButtonClass = "bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 px-4 rounded flex items-center justify-center";
  const buttonClasses = buttonClassName || defaultButtonClass;

  return (
    <>
      {/* Contact Seller Button */}
      <button
        type="button"
        onClick={openModal}
        className={`${buttonClasses} ${buttonFullWidth ? 'w-full' : ''}`}
      >
        <Send size={16} className="mr-2" />
        {buttonText}
      </button>

      {/* Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Seller about &qout;{listingName}&qout;
              </h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSendMessage}>
                <div className="mb-4">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Ask a question about this magical item..."
                  />
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center"
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={14} className="mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}