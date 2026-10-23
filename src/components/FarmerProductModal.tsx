import React, { useState, useEffect } from 'react';
import { MarketplaceItem, CropCategory, CropUnit, UserProfile } from '../types';

interface FarmerProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  editingItem?: MarketplaceItem | null;
  onSaveProduct: (itemData: Omit<MarketplaceItem, 'id' | 'postedDate' | 'trustScore'>) => void;
  onUpdateProduct?: (id: string, updated: Partial<MarketplaceItem>) => void;
}

const PRESET_CROP_IMAGES = [
  {
    label: 'Golden Wheat Grains',
    url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Alphonso Mangoes',
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Red Tomatoes',
    url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Aromatic Basmati Rice',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Sweet Yellow Corn',
    url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Desi Bengal Gram',
    url: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e3?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Fresh Organic Spinach',
    url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Red Onions',
    url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=800&q=80',
  },
];

export const FarmerProductModal: React.FC<FarmerProductModalProps> = ({
  isOpen,
  onClose,
  user,
  editingItem,
  onSaveProduct,
  onUpdateProduct,
}) => {
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [category, setCategory] = useState<CropCategory>('Grains');
  const [availableQuantity, setAvailableQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<CropUnit>('Quintal');
  const [price, setPrice] = useState<number>(2200);
  const [grade, setGrade] = useState<'A+' | 'Grade A' | 'Grade B' | 'Grade C'>('A+');
  const [harvestDate, setHarvestDate] = useState('2026-11-10');
  const [description, setDescription] = useState('');
  const [isOrganic, setIsOrganic] = useState(true);
  const [aiCertified, setAiCertified] = useState(true);
  const [village, setVillage] = useState(user.village || 'Anand');
  const [district, setDistrict] = useState(user.district || 'Anand');
  const [state, setState] = useState(user.state || 'Gujarat');
  const [imageUrl, setImageUrl] = useState(PRESET_CROP_IMAGES[0].url);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // AI Market Price & Crop Advisor state
  const [advisorResult, setAdvisorResult] = useState<any | null>(null);
  const [isAnalyzingAdvisor, setIsAnalyzingAdvisor] = useState(false);

  const handleRunAdvisor = async () => {
    if (!cropName.trim()) return;
    setIsAnalyzingAdvisor(true);
    try {
      const res = await fetch('/api/market-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cropName,
          location: `${village}, ${district}, ${state}`,
          quantity: availableQuantity,
          unit,
          askingPrice: price,
          isOrganic,
        }),
      });
      const data = await res.json();
      if (data.data) {
        setAdvisorResult(data.data);
      }
    } catch (err) {
      console.error('Error running market advisor:', err);
    } finally {
      setIsAnalyzingAdvisor(false);
    }
  };

  useEffect(() => {
    if (editingItem) {
      setCropName(editingItem.cropName || editingItem.title);
      setVariety(editingItem.variety || '');
      setCategory(editingItem.category);
      setAvailableQuantity(editingItem.availableQuantity);
      setUnit(editingItem.unit);
      setPrice(editingItem.price);
      setGrade(editingItem.grade);
      setHarvestDate(editingItem.harvestDate || '2026-11-10');
      setDescription(editingItem.description || '');
      setIsOrganic(editingItem.isOrganic);
      setAiCertified(editingItem.aiCertified);
      setVillage(editingItem.village || user.village || 'Anand');
      setDistrict(editingItem.district || user.district || 'Anand');
      setState(editingItem.state || user.state || 'Gujarat');
      setImageUrl(editingItem.imageUrl);
      setAdditionalImages(editingItem.additionalImages || []);
    } else {
      // Reset form
      setCropName('');
      setVariety('');
      setCategory('Grains');
      setAvailableQuantity(100);
      setUnit('Quintal');
      setPrice(2200);
      setGrade('A+');
      setHarvestDate('2026-11-10');
      setDescription('');
      setIsOrganic(true);
      setAiCertified(true);
      setVillage(user.village || 'Anand');
      setDistrict(user.district || 'Anand');
      setState(user.state || 'Gujarat');
      setImageUrl(PRESET_CROP_IMAGES[0].url);
      setAdditionalImages([]);
    }
  }, [editingItem, user, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          const resultStr = reader.result.toString();
          if (!imageUrl) {
            setImageUrl(resultStr);
          } else {
            setAdditionalImages((prev) => [...prev, resultStr]);
          }
        }
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const resultStr = reader.result.toString();
            if (!imageUrl) {
              setImageUrl(resultStr);
            } else {
              setAdditionalImages((prev) => [...prev, resultStr]);
            }
          }
        };
        reader.readAsDataURL(file as Blob);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = variety ? `${cropName} (${variety})` : cropName;
    const locationStr = `${village}, ${district}, ${state}`;

    if (editingItem && onUpdateProduct) {
      onUpdateProduct(editingItem.id, {
        title,
        cropName,
        variety,
        category,
        availableQuantity,
        unit,
        price,
        grade,
        harvestDate,
        description,
        isOrganic,
        aiCertified,
        village,
        district,
        state,
        location: locationStr,
        imageUrl,
        additionalImages,
      });
    } else {
      onSaveProduct({
        title,
        cropName,
        variety,
        category,
        sellerName: `${user.name} (${user.farmName || 'Local Farm'})`,
        sellerId: user.farmerId || 'FID-883920',
        village,
        district,
        state,
        location: locationStr,
        distance: 'Local Farm',
        price,
        unit,
        grade,
        aiCertified,
        isOrganic,
        status: 'Available',
        harvestDate,
        description: description || `Freshly harvested ${cropName} directly from ${village}, ${state}. AI quality verified.`,
        imageUrl,
        additionalImages,
        availableQuantity,
        minOrderQuantity: Math.min(10, availableQuantity),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="glass-panel rounded-3xl p-6 md:p-8 max-w-2xl w-full my-8 slide-up shadow-2xl relative border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-outline-variant/20">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1">
              <span className="material-symbols-outlined text-sm">agriculture</span>
              <span>Farmer Produce Listing</span>
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface">
              {editingItem ? 'Edit Crop Product' : 'Add New Crop Product'}
            </h2>
            <p className="text-xs text-on-surface-variant">
              List your harvested crops directly on the Indian Agri Marketplace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container cursor-pointer text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Crop Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-outline-variant/10 pb-1">
              1. Crop Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Crop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharbati Wheat, Red Tomatoes"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Variety / Sub-Type</label>
                <input
                  type="text"
                  placeholder="e.g. Sharbati, Hybrid Abhinav, Lokwan"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CropCategory)}
                  className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Grains">Grains & Cereals</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Pulses">Pulses & Legumes</option>
                  <option value="Spices">Spices & Cash Crops</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Quality Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as any)}
                  className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="A+">A+ (Export Quality / Premium)</option>
                  <option value="Grade A">Grade A (Standard High Quality)</option>
                  <option value="Grade B">Grade B (Commercial)</option>
                  <option value="Grade C">Grade C (Processing)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Quantity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-outline-variant/10 pb-1">
              2. Quantity & Mandi Pricing (₹)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Unit Type</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as CropUnit)}
                  className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Quintal">Quintal (100 Kg)</option>
                  <option value="Kg">Kg (Kilogram)</option>
                  <option value="Tonne">Tonne (1,000 Kg)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Price (₹ per {unit}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-primary text-sm">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-extrabold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Available Quantity ({unit}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={availableQuantity}
                  onChange={(e) => setAvailableQuantity(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-extrabold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Harvest Date</label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col justify-center gap-2 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-on-surface">
                  <input
                    type="checkbox"
                    checked={isOrganic}
                    onChange={(e) => setIsOrganic(e.target.checked)}
                    className="accent-primary w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-emerald-700 text-sm">eco</span>
                    Organic Certified Crop
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-on-surface">
                  <input
                    type="checkbox"
                    checked={aiCertified}
                    onChange={(e) => setAiCertified(e.target.checked)}
                    className="accent-primary w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    AI Quality Inspected
                  </span>
                </label>
              </div>
            </div>

            {/* AI Market Price & Crop Advisor Feature Button & Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-tertiary-container/10 to-primary/5 border border-primary/20 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                  <div>
                    <h4 className="text-xs font-extrabold text-on-surface">AI Market Price & Crop Advisor</h4>
                    <p className="text-[10px] text-on-surface-variant font-medium">Gemini real-time price recommendation & agronomic guide</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunAdvisor}
                  disabled={isAnalyzingAdvisor || !cropName.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-white font-extrabold text-xs hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isAnalyzingAdvisor ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      <span>Run AI Advisor</span>
                    </>
                  )}
                </button>
              </div>

              {/* Advisor Results Display */}
              {advisorResult && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-inverse-surface border border-primary/30 text-xs space-y-3 slide-up">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/20">
                      <span className="text-[10px] text-on-surface-variant font-bold block uppercase">Recommended Price</span>
                      <span className="font-extrabold text-primary text-sm">₹{advisorResult.recommendedPrice} /{unit}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/20">
                      <span className="text-[10px] text-on-surface-variant font-bold block uppercase">Market Demand</span>
                      <span className="font-extrabold text-emerald-700 text-xs">{advisorResult.marketDemand}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/20">
                      <span className="text-[10px] text-on-surface-variant font-bold block uppercase">Expected Profit</span>
                      <span className="font-extrabold text-amber-700 text-xs">₹{advisorResult.expectedProfit?.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/20">
                      <span className="text-[10px] text-on-surface-variant font-bold block uppercase">AI Confidence</span>
                      <span className="font-extrabold text-blue-700 text-xs">{advisorResult.confidenceScore}%</span>
                    </div>
                  </div>

                  {/* Strategy & Risk */}
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface text-[11px]">Best Selling Strategy:</span>
                      <span className="text-on-surface-variant text-[11px] font-medium">{advisorResult.bestSellingTime}</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-tight">
                      <strong className="text-primary">Recommendation:</strong> {advisorResult.waitingRecommendation}
                    </p>
                  </div>

                  {/* Crop Advisor Tabs / Details */}
                  {advisorResult.cropAdvisor && (
                    <div className="border-t border-outline-variant/20 pt-2.5 space-y-1.5">
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block">
                        🌱 AI Agronomist Recommendations:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-surface-container-low">
                          <strong className="text-on-surface block mb-0.5">Fertilizer Guide:</strong>
                          <p className="text-on-surface-variant leading-snug">{advisorResult.cropAdvisor.fertilizer}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container-low">
                          <strong className="text-on-surface block mb-0.5">Irrigation & Moisture:</strong>
                          <p className="text-on-surface-variant leading-snug">{advisorResult.cropAdvisor.watering}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container-low">
                          <strong className="text-on-surface block mb-0.5">Harvest Timing:</strong>
                          <p className="text-on-surface-variant leading-snug">{advisorResult.cropAdvisor.harvestTime}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-container-low">
                          <strong className="text-on-surface block mb-0.5">Storage & Protection:</strong>
                          <p className="text-on-surface-variant leading-snug">{advisorResult.cropAdvisor.storageTips}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Farm Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-outline-variant/10 pb-1">
              3. Origin Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Village</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Images & Description */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-outline-variant/10 pb-1">
              4. Crop Images & Description
            </h3>

            {/* Presets vs Custom Upload */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-2">Select Preset Image or Upload Your Own</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
                {PRESET_CROP_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`relative rounded-xl overflow-hidden h-14 border-2 transition-all cursor-pointer ${
                      imageUrl === preset.url ? 'border-primary ring-2 ring-primary/40' : 'border-outline-variant/30 opacity-70 hover:opacity-100'
                    }`}
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* File Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                dragActive ? 'border-primary bg-primary/10' : 'border-outline-variant/40 bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-primary text-3xl mb-1">cloud_upload</span>
              <p className="text-xs font-bold text-on-surface">Drag & drop photos here or click to browse</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">Supports PNG, JPG, WEBP up to 10MB (Multiple uploads supported)</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="inline-block mt-2 px-3 py-1 rounded-lg bg-primary text-white font-bold text-[11px] cursor-pointer hover:bg-emerald-700 transition-colors"
              >
                Choose Photo Files
              </label>
            </div>

            {/* Uploaded Images Preview Thumbnails */}
            {(imageUrl || additionalImages.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {imageUrl && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-primary">
                    <img src={imageUrl} alt="Main crop" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 text-[8px] font-bold bg-primary text-white text-center py-0.5">
                      Primary
                    </span>
                  </div>
                )}
                {additionalImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-outline-variant/40">
                    <img src={img} alt={`Additional ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAdditionalImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0 right-0 bg-black/70 text-white rounded-bl-lg p-0.5"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Detail crop quality, harvest process, packaging, moisture levels, or bulk delivery terms..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-white border border-outline-variant/40 text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-outline-variant/40 font-bold text-xs text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-emerald-700 text-white font-bold text-xs hover:shadow-lg hover:shadow-primary/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{editingItem ? 'Save Changes' : 'Publish Product Listing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
