import { Box } from "@mui/material";
import React, { useState } from "react";
import styled from "styled-components";


const Title = styled.h2`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #444;
`;

const ReviewCard = styled.div`
  border-top: 1px solid #ddd;
  padding: 15px 0;
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const Reviewer = styled.div`
  font-weight: bold;
`;

const Country = styled.div`
  font-size: 12px;
  color: #777;
`;

const Rating = styled.div`
  font-size: 16px;
  color: #ffb400;
  text-align: right;
`;

const ReviewText = styled.p`
  font-size: 14px;
  color: #222;
  margin-top: 5px;
`;

const ShowMore = styled.span`
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
`;

const reviews = [
  {
    name: "Amazing agent",
    country: "United States",
    yearsUsing: "About 3 years using the app",
    rating: 1,
    date: "March 1, 2025",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.Sed nisi. Nulla quis sem at nibh elementum imperdiet Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis...",
  },
  {
    name: "perform+",
    country: "Germany",
    yearsUsing: "Almost 3 years using the app",
    rating: 5,
    date: "February 28, 2025",
    text: "I love this app. It's so easy to use and the interface is great.",
  },
  {
    name: "Love it",
    country: "United States",
    yearsUsing: "About 3 years using the app",
    rating: 5,
    date: "February 14, 2025",
    text: "This was really simple to set up.",
  },
];

const ReviewsPlaceholder = () => {
  return (
    <Box>
      <Title>What customers think ✨</Title>
      <Description>
        Customers praise the agent for its easy setup and user-friendly interface, noting its seamless integration...
      </Description>
      {reviews.map((review, index) => (
        <Review key={index} review={review} />
      ))}
    </Box>
  );
};


const Review = ({ review }: {
  review: {
    name: string;
    country: string;
    yearsUsing: string;
    rating: number;
    date: string;
    text: string;
  };
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <ReviewCard>
      <ReviewHeader>
        <div>
          <Reviewer>{review.name}</Reviewer>
          <Country>{review.country}</Country>
          <Country>{review.yearsUsing}</Country>
        </div>
        <div>
          <Rating>{"★".repeat(review.rating) + "☆".repeat(5 - review.rating)}</Rating>
          <Country>{review.date}</Country>
        </div>
      </ReviewHeader>
      <ReviewText>
        {expanded ? review.text : `${review.text.substring(0, 100)}...`}
      </ReviewText>
      {review.text.length > 100 && (
        <ShowMore onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less" : "Show more"}
        </ShowMore>
      )}
    </ReviewCard>
  );
};

export default ReviewsPlaceholder;
