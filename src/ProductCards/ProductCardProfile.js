import { Box, Card, Heading, Image, Stack, Text, Badge, Flex } from '@chakra-ui/react'
import React from 'react'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HomeIcon from '@mui/icons-material/Home';
import './ProductCard.css'; // Import custom CSS

export default function ProductCardProfile({ad}) {
  // Return early if ad is null or undefined
  if (!ad) {
    return null; // Or a placeholder card that doesn't depend on ad properties
  }
  
  // Helper function to check if the product belongs to a specific category
  const isCategory = (categoryName) => {
    return ad.catagory && ad.catagory.toLowerCase() === categoryName.toLowerCase();
  };
  
  // Helper function to check if subcategory contains a term
  const hasSubcategory = (term) => {
    return ad.subcatagory && ad.subcatagory.toLowerCase().includes(term.toLowerCase());
  };
  
  // Determine if this is a car/bike product
  const isVehicle = isCategory('cars') || isCategory('bikes') || 
                   hasSubcategory('car') || hasSubcategory('bike') || 
                   hasSubcategory('motorcycle');
  
  // Determine if this is a property
  const isProperty = isCategory('properties') || hasSubcategory('house') || 
                    hasSubcategory('apartment') || hasSubcategory('flat') || 
                    hasSubcategory('property');
  
  // Extract KM driven from vehicle data
  const kmDriven = ad.vehicleData?.kmDriven;
  
  // Extract BHK from property data
  const bhk = ad.propertyData?.bhk;
  
  // Format price with commas and handle lakhs
  const formatPrice = (price) => {
    if (!price) return "Price unavailable";
    
    // Convert to number to ensure proper formatting
    const numPrice = Number(price);
    
    // Handle lakhs and crores
    if (numPrice >= 10000000) {
      return `${(numPrice / 10000000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
    }
    
    if (numPrice >= 100000) {
      return `${(numPrice / 100000).toFixed(2).replace(/\.?0+$/, '')} L`;
    }
    
    // For prices less than 1 lakh, use standard comma formatting
    return numPrice.toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
  };
  
  return (
    <Card className="olx-profile-card" key={ad._id}>
      <a href={`/preview_ad/${ad._id}`} className="olx-profile-card-link">
        <Stack className="olx-profile-card-content" direction="row" spacing={3}>
          <Box className="olx-profile-image-container">
            <Box className="olx-card-image-wrapper">
              <Image
                src={ad.productpic1}
                alt={ad.title}
                className="olx-profile-image"
              />
            </Box>
            
            {/* FEATURED badge */}
            {ad.isPromoted && (
              <Badge className="olx-profile-featured-badge">
                FEATURED
              </Badge>
            )}
            
            {/* Vehicle details overlay */}
            {isVehicle && kmDriven && (
              <Badge className="olx-profile-badge vehicle">
                <DirectionsCarIcon fontSize="small" style={{ marginRight: '2px' }} />
                {kmDriven} km
              </Badge>
            )}
            
            {/* Property details overlay */}
            {isProperty && bhk && (
              <Badge className="olx-profile-badge property">
                <HomeIcon fontSize="small" style={{ marginRight: '2px' }} />
                {bhk} BHK
              </Badge>
            )}
          </Box>
          <Stack className="olx-profile-details" spacing={1}>
            <Text className="olx-profile-title">
              {ad.title}
            </Text>
            <Text className="olx-profile-description">
              {ad.description && ad.description.substring(0, 60)}{ad.description && ad.description.length > 60 ? '...' : ''}
            </Text>
            <Box className="olx-profile-price-container">
              <Text className="olx-profile-price">
                ₹ {formatPrice(ad.price)}
              </Text>
            </Box>
          </Stack>
        </Stack>
      </a>
    </Card>
  )
}
