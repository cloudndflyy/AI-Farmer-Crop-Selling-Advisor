import React, { useState } from 'react';
import { MarketplaceItem } from '../types';

interface ProductDetailModalProps {
  item: MarketplaceItem | null;
  onClose: () => void;
  onOrderClick: (item: MarketplaceItem) => void;
  onOpenChat?: (item: MarketplaceItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ item, onClose, onOrderClick, onOpenChat }) => {
  if (!item) return null;

  const allImages = [item.imageUrl, ...(item.additionalImages || [])];
  const [selectedImg, setSelectedImg] = useState(allImages[0]);
  const [inquirySent, setInquirySent] = useState(false);

  const handleSendInquiry = () => {
    if (onOpenChat) {
      onClose();
      onOpenChat(item);
    } else {
      setInquirySent(true);
      setTimeout(() => {
        setInquirySent(false);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="glass-panel rounded-3xl p-6 md:p-8 max-w-2xl w-full my-8 slide-up shadow-2xl relative border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                {item.category}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md ${
                  item.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {item.status}
              </span>
              {item.isOrganic && (
                <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">eco</span> Organic
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface">{item.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container cursor-pointer text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Gallery & Quick Specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          {/* Gallery Left Column */}
          <div className="md:col-span-6 space-y-3">
            <div className="relative rounded-2xl overflow-hidden h-64 bg-surface-container-low border border-outline-variant/20 shadow-xs">
              <img src={selectedImg} alt={item.title} className="w-full h-full object-cover" />
              <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full">
                {item.grade}
              </span>
              {item.aiCertified && (
                <span className="absolute top-2 right-2 text-[10px] font-bold text-emerald-950 bg-emerald-200/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span> AI Certified
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImg(img)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImg === img ? 'border-primary ring-2 ring-primary/30' : 'border-outline-variant/30 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Right Column */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Price Tag */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <span className="text-xs font-semibold text-on-surface-variant block mb-0.5">Mandi Rate / Direct Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-primary">₹{item.price.toLocaleString('en-IN')}</span>
                  <span className="text-sm font-bold text-on-surface-variant">/ {item.unit}</span>
                  {item.oldPrice && (
                    <span className="text-xs text-on-surface-variant line-through ml-2">₹{item.oldPrice.toLocaleString('en-IN')}</span>
                  )}
                </div>
              </div>

              {/* Specs Table */}
              <div className="p-4 rounded-2xl bg-white border border-outline-variant/30 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant font-medium">Seller Name:</span>
                  <span className="font-bold text-on-surface">{item.sellerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant font-medium">Village & District:</span>
                  <span className="font-bold text-on-surface">{item.village}, {item.district}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant font-medium">State & Distance:</span>
                  <span className="font-bold text-on-surface">{item.state} ({item.distance})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant font-medium">Available Supply:</span>
                  <span className="font-extrabold text-primary">{item.availableQuantity} {item.unit}s</span>
                </div>
                {item.minOrderQuantity && (
                  <div className="flex justify-between py-1 border-b border-outline-variant/10">
                    <span className="text-on-surface-variant font-medium">Minimum Order:</span>
                    <span className="font-bold text-on-surface">{item.minOrderQuantity} {item.unit}s</span>
                  </div>
                )}
                {item.harvestDate && (
                  <div className="flex justify-between py-1 border-b border-outline-variant/10">
                    <span className="text-on-surface-variant font-medium">Harvest Date:</span>
                    <span className="font-semibold text-on-surface">{item.harvestDate}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant font-medium">Posted Date:</span>
                  <span className="font-semibold text-on-surface">{item.postedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
          <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-1">Crop Details & Description</h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">{item.description}</p>
        </div>

        {/* Feedback Message */}
        {inquirySent && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2 slide-up">
            <span className="material-symbols-outlined text-sm text-emerald-700">check_circle</span>
            <span>Inquiry sent to seller {item.sellerName}. They will contact you via WhatsApp/Phone shortly!</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleSendInquiry}
            className="flex-1 py-3 px-4 rounded-xl border border-primary text-primary font-bold text-xs hover:bg-primary/5 cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">chat</span>
            <span>Contact Seller ({item.sellerName.split(' ')[0]})</span>
          </button>

          {item.status === 'Available' ? (
            <button
              onClick={() => {
                onClose();
                onOrderClick(item);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-emerald-700 text-white font-bold text-xs hover:shadow-lg hover:shadow-primary/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">shopping_cart</span>
              <span>Place Bulk Purchase Order</span>
            </button>
          ) : (
            <button
              disabled
              className="flex-1 py-3 px-4 rounded-xl bg-gray-200 text-gray-500 font-bold text-xs cursor-not-allowed text-center"
            >
              Produce Marked Sold Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
