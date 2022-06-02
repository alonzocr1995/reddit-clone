import { useMutation, useQuery } from '@apollo/client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import React, { Fragment } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import ReactTimeago from 'react-timeago'
import Avatar from '../../components/Avatar'
import PostComp from '../../components/PostComp'
import { ADD_COMMENT } from '../../graphql/mutations'
import { GET_POST_BY_POST_ID } from '../../graphql/queries'
import { Post } from '../../typing'

type FormData = {
  comment: string
}

const PostPage = () => {
  const router = useRouter()

  const { data: session } = useSession()
  const [addComment] = useMutation(ADD_COMMENT, {
    refetchQueries: [GET_POST_BY_POST_ID, 'getPostByPostId'],
  })
  const { data, error, loading } = useQuery(GET_POST_BY_POST_ID, {
    variables: {
      post_id: router.query.postId,
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>()
  const post: Post = data?.getPostByPostId

  const onSubmit = handleSubmit(async (data: FormData) => {
    //post comment here
    console.log(data)
    const notification = toast.loading('Posting your comment')

    await addComment({
      variables: {
        post_id: router.query.postId,
        username: session?.user?.name,
        text: data.comment,
      },
    })

    setValue('comment', '')

    toast.success('Succesfully posted!', {
      id: notification,
    })
  })

  console.log(data)

  return (
    <div className="my-7 mx-auto max-w-5xl">
      <PostComp post={post} />
      {post && (
        <Fragment>
          <div className="-mt-1 rounded-b-md border border-t-0 border-gray-300 bg-white p-5 pl-16 ">
            <p className="text-sm">
              Comment as{' '}
              <span className="text-red-500 "> {session?.user?.name}</span>
            </p>
            <form onSubmit={onSubmit} className="flex flex-col space-y-2">
              <textarea
                {...register('comment')}
                disabled={!session}
                className="h-24  resize-none rounded-md border border-gray-200 p-2 pl-4 outline-none disabled:bg-gray-50"
                placeholder={
                  session ? 'What are your thoughts?' : 'Sign in to comment'
                }
              ></textarea>
              <button
                disabled={!session}
                type="submit"
                className="rounded-full bg-red-500 p-3 font-semibold text-white disabled:bg-gray-200"
              >
                Comment
              </button>
            </form>
          </div>

          <div className="-my-5 rounded-b-md border border-t-0 border-gray-300 bg-white py-5 px-10">
            <hr className="py-2" />
            {post?.comments.map((comment) => (
              <div
                key={comment.id}
                className="relative flex items-center space-x-2 space-y-5"
              >
                <hr className="absolute top-10 left-7 z-0 h-16 border" />
                <div className="z-50">
                  <Avatar seed={comment.username} />
                </div>
                <div className="flex flex-col">
                  <p className="py-2 text-xs text-gray-400">
                    <span className="font-semibold text-gray-600">
                      {comment.username}
                    </span>
                    • <ReactTimeago date={comment.created_at} />
                  </p>
                  <p>{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Fragment>
      )}
    </div>
  )
}

export default PostPage