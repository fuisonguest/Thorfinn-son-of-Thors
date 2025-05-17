import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CatNavbar from '../CatNavbar';
import { Box, Button, Container, Grid, GridItem, Flex } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCards/ProductCard';
import SearchNotFound from '../resources/SearchNotFound';
import NotFound from '../resources/NotFound';
import Loading from '../resources/Loading';

export default function SearchResults() {
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get('query');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleproducts, setVisibleProducts] = useState(6);
  const hasMoreProductsToLoad = visibleproducts < results.length;

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://retrend-final.onrender.com/search?q=${query}`);
        
        // Sort products to prioritize promoted products
        const sortedResults = [...response.data].sort((a, b) => {
          if (a.isPromoted && !b.isPromoted) return -1;
          if (!a.isPromoted && b.isPromoted) return 1;
          return 0;
        });
        
        setResults(sortedResults);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('An error occurred while fetching data.');
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  if (loading) {
    return <Loading />;
  }

if (results.length === 0) {
    return <SearchNotFound />;
}

  if (error) {
    return <NotFound />;
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
            {results.slice(0, visibleproducts).map((product) => (
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
