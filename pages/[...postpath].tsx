import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { GetStaticProps, GetStaticPaths } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

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
  const pathArr = context.params.postpath as Array<string> | undefined;
  const path = pathArr?.join('/');

  if (!path) {
    return {
      notFound: true,
    };
  }

  const variables = {
    path,
  };

  const query = gql`
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
            mediaDetails {
              width
              height
            }
          }
        }
      }
    }
  `;

  const data = await graphQLClient.request(query, variables);

  if (!data.post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      path,
      post: data.post,
      host: process.env.NEXT_PUBLIC_HOST,
    },
  };
};

interface PostProps {
  post: any;
  host: string;
  path: string;
}

const Post: React.FC<PostProps> = (props) => {
  const { post, host, path } = props;

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
        <link rel="canonical" href={`https://${host}/${path}`} />
        <meta property="og:description" content={removeTags(post.excerpt)} />
        <meta property="og:url" content={`https://${host}/${path}`} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={host.split('.')[0]} />
        <meta property="article:published_time" content={post.dateGmt} />
        <meta property="article:modified_time" content={post.modifiedGmt} />
        <meta property="og:image" content={post.featuredImage.node.sourceUrl} />
                       
        <title>{post.title}</title>
      </Head>
      <div className="post-container">
        <h1>{post.title}</h1>
        <Image
          src={post.featuredImage.node.sourceUrl}
          alt={post.featuredImage.node.altText || post.title}
          width={post.featuredImage.node.mediaDetails.width}
          height={post.featuredImage.node.mediaDetails.height}
        />
        <article dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </>
  );
};

export default Post;

