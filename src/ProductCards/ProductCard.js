import {
  Card,
  Flex,
  Image,
  Text,
  Badge,
  Box,
  Icon,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import CurrencyRupeeTwoToneIcon from "@mui/icons-material/CurrencyRupeeTwoTone";
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HomeIcon from '@mui/icons-material/Home';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import axios from "axios";
import { API_BASE_URL } from "../utils/config";
import './ProductCard.css'; // Import custom CSS

export default function ProductCard({ product }) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  const address = product.address?.[0] || {};
  const createdAt = new Date(product.createdAt);
  const now = new Date();
  // Calculate the time difference in milliseconds
  const timeDiff = now.getTime() - createdAt.getTime();
  // Convert milliseconds to days
  const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  // Helper function to check if the product belongs to a specific category
  const isCategory = (categoryName) => {
    return product.catagory && product.catagory.toLowerCase() === categoryName.toLowerCase();
  };
  
  // Helper function to check if subcategory contains a term
  const hasSubcategory = (term) => {
    return product.subcatagory && product.subcatagory.toLowerCase().includes(term.toLowerCase());
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
  const kmDriven = product.vehicleData?.kmDriven;
  const year = product.vehicleData?.year;
  
  // Extract BHK from property data
  const bhk = product.propertyData?.bhk;
  
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
  
  // Format vehicle details string for display
  const getVehicleDetailsString = () => {
    let details = [];
    if (year) details.push(year);
    if (kmDriven) details.push(`${kmDriven} km`);
    return details.join(' - ');
  };
  
  // Toggle wishlist function
  const toggleWishlist = async (e) => {
    e.preventDefault(); // Prevent navigation when clicking the heart
    e.stopPropagation(); // Stop event from bubbling up
    
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        toast({
          title: "Authentication required",
          description: "Please login to add items to your wishlist",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      if (isInWishlist) {
        // Remove from wishlist - use the same endpoint as in PreviewAd.js
        await axios.delete(`https://retrend-final.onrender.com/wishlist/remove/${product._id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        setIsInWishlist(false);
        toast({
          title: "Removed from Wishlist",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        // Add to wishlist - use the same endpoint as in PreviewAd.js
        await axios.post(
          "https://retrend-final.onrender.com/wishlist/add",
          { productId: product._id },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        setIsInWishlist(true);
        toast({
          title: "Added to Wishlist",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Wishlist operation failed:", error);
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check if the product is in the user's wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return;
        
        // Get all wishlist items and check if this product is in it
        const response = await axios.get("https://retrend-final.onrender.com/wishlist", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        
        if (response.data && Array.isArray(response.data)) {
          // Check if this product is in the wishlist
          const found = response.data.some(item => 
            item.productId && item.productId._id === product._id
          );
          setIsInWishlist(found);
        }
      } catch (error) {
        console.error("Error checking wishlist status:", error);
      }
    };
    
    if (product && product._id) {
      checkWishlistStatus();
    }
  }, [product._id]);
  
  return (
    <Card className="olx-product-card">
      {/* Image section with heart icon */}
      <Box className="olx-card-image-container">
        <Box className="olx-card-image-wrapper">
          <Image
            src={product.productpic1}
            alt={product.title || "Product image"}
            className="olx-card-image"
          />
        </Box>
        
        <IconButton
          icon={isInWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          className={`olx-wishlist-icon ${isInWishlist ? 'active' : ''}`}
          aria-label={isInWishlist ? "Remove from favorites" : "Add to favorites"}
          onClick={toggleWishlist}
          isLoading={loading}
        />
        
        {/* FEATURED tag */}
        {product.isPromoted && (
          <Badge className="olx-featured-badge">
            FEATURED
          </Badge>
        )}
      </Box>
      
      {/* Content section */}
      <Box className="olx-card-content" display="flex" flexDirection="column" height="100%">
        {/* Price */}
        <Flex className="olx-price-container">
          <Text className="olx-price">
            ₹ {formatPrice(product.price)}
          </Text>
        </Flex>
        
        {/* Title */}
        <Text className="olx-title">
          {product.title}
        </Text>
        
        {/* Vehicle or property details */}
        {isVehicle && (
          <Text className="olx-details">
            {getVehicleDetailsString()}
          </Text>
        )}
        
        {isProperty && (
          <Text className="olx-details">
            {bhk ? `${bhk} BHK` : ''} {product.propertyData?.area ? `- ${product.propertyData.area} sqft` : ''}
          </Text>
        )}
        
        {/* Location and date */}
        <Flex className="olx-location-date" mt="auto">
          <Text className="olx-location">
            {address.area || ''}{address.area && address.city ? ', ' : ''}{address.city || ''}
          </Text>
          
          <Text className="olx-date">
            {daysAgo === 0 ? 'TODAY' : daysAgo === 1 ? 'YESTERDAY' : `${daysAgo} DAYS AGO`}
          </Text>
        </Flex>
      </Box>
    </Card>
  );
}
