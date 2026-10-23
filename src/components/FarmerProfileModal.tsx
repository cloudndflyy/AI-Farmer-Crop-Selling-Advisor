import React, { useState } from 'react';
import { FarmerProfileData, MarketplaceItem, Language, UserProfile } from '../types';
import { t } from '../data/translations';

interface FarmerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: FarmerProfileData;
  farmerProducts: MarketplaceItem[];
  user: UserProfile;
  lang: Language;
  onAddReview: (farmerId: string, rating: number, comment: string) => void;
  onSelectProduct?: (product: MarketplaceItem) => void;
}

export const FarmerProfileModal: React.FC<FarmerProfileModalProps> = ({
  isOpen,
  onClose,
  farmer,
  farmerProducts,
  user,
  lang,
  onAddReview,
  onSelectProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'reviews'>('overview');
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddReview(farmer.farmerId, newRating, newComment);
    setNewComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="glass-panel rounded-3xl p-6 md:p-8 max-w-3xl w-full my-8 slide-up shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex justify-between items-start pb-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary/10 text-primary material-symbols-outlined text-2xl">
              agriculture
            </span>
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{t('farmer_profile', lang)}</span>
              <h2 className="text-2xl font-extrabold text-on-surface">{farmer.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container cursor-pointer text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Hero Card */}
        <div className="py-4 border-b border-outline-variant/20 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative shrink-0">
            <img
              src={farmer.avatarUrl}
              alt={farmer.name}
              className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-primary"
            />
            {farmer.verificationBadge && (
              <span
                className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-full shadow-md text-sm"
                title={t('verification_badge', lang)}
              >
                <span className="material-symbols-outlined text-base block" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </span>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="font-extrabold text-lg text-on-surface">{farmer.farmName}</span>
              {farmer.verificationBadge && (
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  {t('verification_badge', lang)}
                </span>
              )}
            </div>

            <p className="text-xs text-on-surface-variant font-medium flex items-center justify-center md:justify-start gap-1">
              <span className="material-symbols-outlined text-sm text-primary">location_on</span>
              {farmer.village}, {farmer.district}, {farmer.state}, India
            </p>

            <p className="text-xs text-on-surface-variant line-clamp-2 italic">{farmer.bio}</p>

            {/* Metrics Pills */}
            <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start text-xs font-bold">
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-amber-500 fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span>{farmer.rating.toFixed(1)} / 5.0 ({farmer.reviewCount} {t('reviews', lang)})</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                <span>{farmer.experienceYears} {t('years_farming', lang)}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">inventory_2</span>
                <span>{farmer.productsListedCount} {t('products_listed', lang)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant/20 text-xs font-bold my-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-4 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Farm Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2.5 px-4 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Listed Products ({farmerProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2.5 px-4 cursor-pointer transition-colors border-b-2 ${
              activeTab === 'reviews'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Buyer Reviews ({farmer.reviews.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-on-surface-variant font-medium block mb-0.5">{t('village', lang)}</span>
                  <span className="font-extrabold text-on-surface text-sm">{farmer.village}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-on-surface-variant font-medium block mb-0.5">{t('district', lang)}</span>
                  <span className="font-extrabold text-on-surface text-sm">{farmer.district}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-on-surface-variant font-medium block mb-0.5">{t('state', lang)}</span>
                  <span className="font-extrabold text-on-surface text-sm">{farmer.state}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-on-surface-variant font-medium block mb-0.5">Soil Type</span>
                  <span className="font-extrabold text-primary text-sm">{farmer.soilType}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                <h4 className="font-extrabold text-sm text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">eco</span>
                  {t('farm_details', lang)}
                </h4>
                <p className="text-on-surface-variant font-medium leading-relaxed">
                  {farmer.bio} Operations span over {farmer.totalAcreage} acres of solar-irrigated farmland equipped with drip irrigation sensors and precision soil telemetry.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
                <div>
                  <span className="font-extrabold text-sm text-on-surface block">Farmer ID: {farmer.farmerId}</span>
                  <span className="text-on-surface-variant">Verified by APMC & Direct Farmers Co-op Gujarat</span>
                </div>
                <span className="material-symbols-outlined text-emerald-600 text-3xl">verified_user</span>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-3">
              {farmerProducts.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-6">{t('no_products_listed', lang)}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {farmerProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onSelectProduct && onSelectProduct(p)}
                      className="p-3 rounded-2xl bg-white border border-outline-variant/30 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <img src={p.imageUrl} alt={p.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="text-[10px] font-bold text-primary uppercase">{p.grade} Grade</span>
                        <h4 className="font-extrabold text-on-surface truncate">{p.title}</h4>
                        <p className="font-bold text-primary text-sm mt-0.5">₹{p.price.toLocaleString('en-IN')} / {p.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviewSubmitted && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>{t('rating_submitted', lang)}</span>
                </div>
              )}

              {/* Form to submit review */}
              <form onSubmit={handleSubmitReview} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3 text-xs">
                <h4 className="font-extrabold text-on-surface text-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rate_review
                  </span>
                  {t('write_a_review', lang)}
                </h4>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-on-surface-variant">Your Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="text-amber-500 text-lg cursor-pointer focus:outline-none"
                      >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: star <= newRating ? "'FILL' 1" : "'FILL' 0" }}>
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share details of your experience with this farmer's produce quality & delivery..."
                  className="w-full p-2.5 rounded-xl bg-white border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />

                <button
                  type="submit"
                  className="bg-primary hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  {t('submit_review', lang)}
                </button>
              </form>

              {/* Reviews List */}
              <div className="space-y-3">
                {farmer.reviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 rounded-2xl bg-white border border-outline-variant/30 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-extrabold text-on-surface block">{rev.reviewerName}</span>
                        <span className="text-[10px] text-on-surface-variant">{rev.reviewerRole}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md font-bold text-[11px] border border-amber-200">
                        <span className="material-symbols-outlined text-amber-500 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span>{rev.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-on-surface font-medium pt-1">"{rev.comment}"</p>
                    <span className="text-[10px] text-on-surface-variant block text-right">{rev.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
