import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { categories } from "./resources/Catagories";
import NotFound from "./resources/NotFound";
import axios from "axios";
import { Box, Button, Container, Grid, GridItem, Flex } from "@chakra-ui/react";
import ProductCard from "./ProductCards/ProductCard";
import SearchNotFound from "./resources/SearchNotFound";
import CatNavbar from "./CatNavbar";
import Loading from "./resources/Loading";


export default function CatagoryView() {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleproducts, setVisibleProducts] = useState(6);
  const hasMoreProductsToLoad = visibleproducts < products.length;

  const isValidCategory = categories.some(
    (cat) => cat.title.toLowerCase() === category.toLowerCase()
  );
  const isValidItem = categories.some((cat) => cat.items.includes(category));

  useEffect(() => {
    if (!isValidCategory && !isValidItem) {
      return;
    }

    const getProductsbyCategory = async () => {
      try {
        const response = await axios.get(`https://retrend-final.onrender.com/getProductsbyCategory/${category}`);
        
        // Sort products to prioritize promoted products
        const sortedProducts = [...response.data].sort((a, b) => {
          if (a.isPromoted && !b.isPromoted) return -1;
          if (!a.isPromoted && b.isPromoted) return 1;
          return 0;
        });
        
        setProducts(sortedProducts);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    getProductsbyCategory();
  }, [category, isValidCategory, isValidItem]);

  if (!isValidCategory && !isValidItem) {
    return <NotFound />;
  }

  if (products.length === 0) {
    return <SearchNotFound />;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <Box>
      <CatNavbar />
      <Container maxW="container.xl">
        <Box position="relative" minH="500px">
          <Grid 
            templateColumns={{ 
              base: "repeat(auto-fill, minmax(200px, 1fr))", 
              sm: "repeat(auto-fill, minmax(200px, 1fr))",
              md: "repeat(auto-fill, minmax(200px, 1fr))", 
              lg: "repeat(auto-fill, minmax(200px, 1fr))", 
              xl: "repeat(auto-fill, minmax(200px, 1fr))" 
            }}
            gap={3}
            autoFlow="row dense"
            justifyItems="stretch"
            maxW="container.xl"
            mb={6}
          >
            {products.slice(0, visibleproducts).map((product) => (
              <GridItem 
                key={product._id}
                w="100%"
              >
                <Link to={`/preview_ad/${product._id}`} style={{ display: 'block', height: '100%' }}>
                  <ProductCard product={product} />
                </Link>
              </GridItem>
            ))}
          </Grid>
        
        {hasMoreProductsToLoad && (
          <Flex justifyContent="center" w="100%" mt={6} mb={4} position="relative">
            <Button
              bgGradient="linear(to-r, teal.400, cyan.600)"
              color="white"
              px={8}
              py={6}
              fontSize="md"
              _hover={{
                bgGradient: "linear(to-r, teal.600, cyan.800)",
              }}
              _active={{
                bgGradient: "linear(to-r, teal.800, cyan.900)",
              }}
              onClick={() => {
                setVisibleProducts((prev) => prev + 10);
              }}
            >
              Load More
            </Button>
          </Flex>
        )}
        </Box>
      </Container>
    </Box>
  );
}
