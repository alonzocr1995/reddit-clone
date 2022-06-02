import { useQuery } from '@apollo/client'
import React from 'react'
import { GET_ALL_POST, GET_ALL_POST_BY_TOPIC } from '../graphql/queries'
import { Post } from '../typing'
import PostComp from './PostComp'

type Props = {
  topic?: string
}

const Feed = ({ topic }: Props) => {
  const { data, error } = !topic
    ? useQuery(GET_ALL_POST)
    : useQuery(GET_ALL_POST_BY_TOPIC, {
        variables: {
          topic: topic,
        },
      })
  const posts: Post[] = !topic ? data?.getPostList : data?.getPostListByTopic

  return (
    <div className="mt-4 space-y-4">
      {posts?.map((post) => (
        <PostComp key={post.id} post={post} />
      ))}
    </div>
  )
}

export default Feed
