import { describe, it, expect } from "vitest";
import { render, screen } from "../test-utils";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/api";

const baseListing: Listing = {
  _id: "listing-123",
  title: "Cozy Downtown Apartment",
  description: "A beautiful apartment in the heart of the city.",
  price: 2500,
  bedrooms: 2,
  bathrooms: 1,
  sqft: 1200,
  city: "Austin",
  state: "TX",
  address: "456 Elm St",
  listingType: "rent",
  photos: ["https://example.com/photo1.jpg"],
  amenities: ["Pool", "Gym"],
  propertyDetails: "Recently renovated",
  screeningCriteria: {
    minCreditScore: 650,
    noEvictions: true,
    noBankruptcy: true,
    noCriminal: true,
    noFraud: true,
  },
  sellerId: "seller-1",
  status: "active",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-02T00:00:00Z",
};

describe("ListingCard", () => {
  it("renders the listing title", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText("Cozy Downtown Apartment")).toBeInTheDocument();
  });

  it("renders the price with /mo for rent listings", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText("$2,500/mo")).toBeInTheDocument();
  });

  it("renders the price without /mo for sale listings", () => {
    const saleListing: Listing = { ...baseListing, listingType: "sale", price: 350000 };
    render(<ListingCard listing={saleListing} />);
    expect(screen.getByText("$350,000")).toBeInTheDocument();
    expect(screen.queryByText(/\/mo/)).not.toBeInTheDocument();
  });

  it("renders bedroom count", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText(/2 bd/)).toBeInTheDocument();
  });

  it("renders bathroom count", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText(/1 ba/)).toBeInTheDocument();
  });

  it("renders square footage", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText(/1,200 sqft/)).toBeInTheDocument();
  });

  it("renders the full address with city and state", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText(/456 Elm St, Austin, TX/)).toBeInTheDocument();
  });

  it("renders 'For Rent' badge for rent listings", () => {
    render(<ListingCard listing={baseListing} />);
    expect(screen.getByText("For Rent")).toBeInTheDocument();
  });

  it("renders 'For Sale' badge for sale listings", () => {
    const saleListing: Listing = { ...baseListing, listingType: "sale" };
    render(<ListingCard listing={saleListing} />);
    expect(screen.getByText("For Sale")).toBeInTheDocument();
  });

  it("links to /listing/:_id", () => {
    render(<ListingCard listing={baseListing} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/listing/listing-123");
  });

  it("uses placeholder image when photos array is empty", () => {
    const noPhotoListing: Listing = { ...baseListing, photos: [] };
    render(<ListingCard listing={noPhotoListing} />);
    const img = screen.getByAltText("Cozy Downtown Apartment");
    expect(img).toHaveAttribute(
      "src",
      "https://placehold.co/800x600/e2e8f0/94a3b8?text=No+Image"
    );
  });
});
