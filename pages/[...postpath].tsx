import React from 'react';
import Head from 'next/head';
import { GetStaticProps, GetStaticPaths } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

// define the GraphQL query for fetching post data
const postQuery = gql`
  query GetPost($path: String!) {
    post(id: $path, idType: URI) {
      id
      excerpt
      title
      link
      dateGmt
      modifiedGmt
      content
      author {
        node {
          name
        }
      }
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
`;

export const getStaticPaths: GetStaticPaths = async () => {
  // fetch the list of post paths to generate static pages for
  const endpoint = process.env.GRAPHQL_ENDPOINT as string;
  const graphQLClient = new GraphQLClient(endpoint);

  const query = gql`
    {
      posts {
        nodes {
          uri
        }
      }
    }
  `;

  const data = await graphQLClient.request(query);

  const paths = data.posts.nodes.map((post: any) => {
    return {
      params: {
        postpath: post.uri.split('/').filter(Boolean),
      },
    };
  });

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  // fetch the post data for the given path and return it as props
  const endpoint = process.env.GRAPHQL_ENDPOINT as string;
  const graphQLClient = new GraphQLClient(endpoint);
  const pathArr = context.params.postpath as Array<string>;
  const path = pathArr.join('/');

  const variables = {
    path,
  };

  const data = await graphQLClient.request(postQuery, variables);

  return {
    props: {
      post: data.post,
    },
  };
};

interface PostProps {
  post: any;
}

const Post: React.FC<PostProps> = ({ post }) => {
  // to remove tags from excerpt
  const removeTags = (str: string) => {
    if (str === null || str === '') return '';
    else str = str.toString();
    return str.replace(/(<([^>]+)>)/gi, '').replace(/\[[^\]]*\]/, '');
  };

  return (
    <>
      <Head>
        <meta property="og:title" content={post.title} />
        <link rel="canonical" href={post.link} />
        <meta property="og:description" content={removeTags(post.excerpt)} />
        <meta property="og:url" content={post.link} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={post.author.node.name} />
        <meta property="article:published_time" content={post.dateGmt} />
        <meta property="article:modified_time" content={post.modifiedGmt} />
        <meta property="og:image" content={post.featuredImage.node.sourceUrl} />
        <meta
          property="og:image:alt"
          content={post.featuredImage.node.altText || post.title}
        />
        <title>{post.title}</title>
      </Head>
      <div className="post-container">
        <h1>{post.title}</h1>
    
<img
          src={post.featuredImage.node.sourceUrl}
          alt={post.featuredImage.node.altText || post.title}
        />
            <article dangerouslySetInnerHTML={{ __html: post.content }} />
  </div>
</>
);
};

export default Post;
