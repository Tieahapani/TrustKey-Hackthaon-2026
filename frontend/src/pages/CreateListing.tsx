import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Upload, X, Plus, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

const AMENITY_OPTIONS = [
  'Parking', 'In-Unit Laundry', 'Shared Laundry', 'Pet-Friendly',
  'Air Conditioning', 'Heating', 'Dishwasher', 'Balcony',
  'Pool', 'Gym', 'Elevator', 'Doorman',
  'Storage', 'Hardwood Floors', 'Furnished', 'Unfurnished',
];

export default function CreateListing() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [price, setPrice] = useState('');
  const [listingType, setListingType] = useState<'rent' | 'sale'>('rent');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sqft, setSqft] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [propertyDetails, setPropertyDetails] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Screening criteria
  const [minCreditScore, setMinCreditScore] = useState('680');
  const [noEvictions, setNoEvictions] = useState(true);
  const [noBankruptcy, setNoBankruptcy] = useState(true);
  const [noCriminal, setNoCriminal] = useState(true);

  if (!profile || profile.role !== 'seller') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Seller Access Only</h2>
        <p className="text-muted-foreground">You must be logged in as a seller to create listings.</p>
      </div>
    );
  }

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Get presigned URL
        const { data } = await api.post('/api/upload/presigned', {
          fileName: file.name,
          fileType: file.type,
        });

        // Upload directly to Vultr
        await fetch(data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        setPhotos((prev) => [...prev, data.fileUrl]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Photo upload failed. You can add photos later.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        address,
        city,
        state,
        price: Number(price),
        listingType,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        sqft: Number(sqft) || 0,
        amenities,
        propertyDetails,
        photos,
        screeningCriteria: {
          minCreditScore: Number(minCreditScore) || 0,
          noEvictions,
          noBankruptcy,
          noCriminal,
        },
      };

      const res = await api.post('/api/listings', payload);
      navigate(`/listing/${res.data._id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-3xl font-bold mb-2">Create New Listing</h1>
      <p className="text-muted-foreground mb-8">Fill in the property details below.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Property Details</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Sunny 2BR Apartment in Downtown"
              className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Describe the property in detail — this is what the AI chatbot will use to answer buyer questions."
              className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Listing Type</label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as 'rent' | 'sale')}
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="rent">For Rent</option>
                <option value="sale">For Sale</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Price {listingType === 'rent' ? '($/month)' : '($)'}
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="2500"
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Bedrooms</label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                required
                min="0"
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bathrooms</label>
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                required
                min="0"
                step="0.5"
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Sq. Ft.</label>
              <input
                type="number"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Location</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="123 Main Street"
              className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="San Francisco"
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                placeholder="CA"
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </section>

        {/* Photos */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Photos</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {photos.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        </section>

        {/* Amenities */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((amenity) => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  amenities.includes(amenity)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-muted'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </section>

        {/* Additional Details */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Additional Details (for AI Assistant)</h2>
          <textarea
            value={propertyDetails}
            onChange={(e) => setPropertyDetails(e.target.value)}
            rows={4}
            placeholder="Add any extra details buyers might ask about — parking info, neighborhood, pet policies, move-in costs, nearby transit, etc. The AI chatbot will use this to answer questions."
            className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </section>

        {/* Screening Criteria */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Screening Criteria</h2>
          <p className="text-sm text-muted-foreground">
            Set your requirements for applicant screening. Buyers will be scored against these criteria.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1.5">Min Credit Score</label>
            <input
              type="number"
              value={minCreditScore}
              onChange={(e) => setMinCreditScore(e.target.value)}
              placeholder="680"
              className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={noEvictions}
                onChange={(e) => setNoEvictions(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">No prior evictions</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={noBankruptcy}
                onChange={(e) => setNoBankruptcy(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">No bankruptcy</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={noCriminal}
                onChange={(e) => setNoCriminal(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">No criminal record</span>
            </label>
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          {loading ? 'Creating...' : 'Publish Listing'}
        </button>
      </form>
    </div>
  );
}
