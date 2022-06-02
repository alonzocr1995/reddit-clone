import { useMutation } from '@apollo/client'
import { LinkIcon, PhotographIcon } from '@heroicons/react/outline'
import { useSession } from 'next-auth/react'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ADD_POST, ADD_SUBREDDIT } from '../graphql/mutations'
import client from '../apollo-client'
import Avatar from './Avatar'
import { GET_ALL_POST, GET_SUBREDDIT_BY_TOPIC } from '../graphql/queries'
import toast from 'react-hot-toast'

type FormData = {
  postTitle: string
  postBody: string
  postImage: string
  subreddit: string
}

type Props = {
  subreddit?: string
}

const PostBox = ({ subreddit }: Props) => {
  const { data: session } = useSession()
  const [addPost] = useMutation(ADD_POST, {
    refetchQueries: [GET_ALL_POST, 'getPostList'],
  })
  const [addSubreddit] = useMutation(ADD_SUBREDDIT)

  const [imgBoxOpen, setImgBoxOpen] = useState<boolean>(false)
  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = handleSubmit(async (formData) => {
    console.log(formData)
    const notification = toast.loading('Creating new post...')

    try {
      // query for the subreddit topic

      const {
        data: { getSubredditListByTopic },
      } = await client.query({
        query: GET_SUBREDDIT_BY_TOPIC,
        variables: {
          topic: subreddit || formData.subreddit,
        },
      })

      const subredditExist = getSubredditListByTopic.length > 0

      console.log('Subreddit list', getSubredditListByTopic)

      if (!subredditExist) {
        //create post
        console.log('Subreddit is new... creating a NEW subreddit')

        const {
          data: { insertSubreddit: newSubreddit },
        } = await addSubreddit({
          variables: {
            topic: formData.subreddit,
          },
        })

        console.log('creting post', formData)

        const image = formData.postImage || ''

        const {
          data: { insertPost: newPost },
        } = await addPost({
          variables: {
            body: formData.postBody,
            image: image,
            subreddit_id: newSubreddit.id,
            title: formData.postTitle,
            username: session?.user?.name,
          },
        })

        console.log('newPost added', newPost)
      } else {
        //use existing post

        console.log('using existing subreddit')
        console.log(getSubredditListByTopic)

        const image = formData.postImage || ''

        const {
          data: { insertPost: newPost },
        } = await addPost({
          variables: {
            body: formData.postBody,
            image: image,
            subreddit_id: getSubredditListByTopic[0].id,
            title: formData.postTitle,
            username: session?.user?.name,
          },
        })
        console.log('new post added', newPost)
      }

      // after post is added

      setValue('postBody', '')
      setValue('postTitle', '')
      setValue('postImage', '')
      setValue('subreddit', '')

      toast.success('New Post cCreated', {
        id: notification,
      })
    } catch (error) {
      toast.error('something went wrong', {
        id: notification,
      })
    }
  })

  return (
    <form
      onSubmit={onSubmit}
      className="sticky top-20 z-50 rounded-md border border-gray-200 bg-white p-2"
    >
      <div className="flex items-center space-x-3">
        <Avatar large={false} seed="alonzo" />
        <input
          {...register('postTitle', { required: true })}
          disabled={!session}
          className="flex-1 rounded-md bg-gray-50 p-2 pl-5 outline-none"
          type="text"
          placeholder={
            session
              ? subreddit
                ? `Create a post in r/${subreddit}`
                : 'Create a post by entering a title'
              : 'Sign in to post'
          }
        />

        <PhotographIcon
          onClick={() => setImgBoxOpen(!imgBoxOpen)}
          className={`h-6 cursor-pointer text-gray-300 ${
            imgBoxOpen && 'text-blue-300'
          }`}
        />
        <LinkIcon className="h-6 cursor-pointer text-gray-300" />
      </div>
      {!!watch('postTitle') && (
        <div className="flex flex-col py-2">
          {/* BOdy */}
          <div className="flex items-center px-2">
            <p className="min-w-[90px]">Body:</p>
            <input
              className="m-2 flex-1 bg-blue-50 p-2 outline-none"
              {...register('postBody')}
              type="text"
              placeholder="Text (optional)"
            />
          </div>
          {/* subreddit */}
          {!subreddit && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Subreddit:</p>
              <input
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
                {...register('subreddit', {
                  required: true,
                })}
                type="text"
                placeholder="i.e. reactjs"
              />
            </div>
          )}

          {imgBoxOpen && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Image URL:</p>
              <input
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
                {...register('postImage')}
                type="text"
                placeholder="Optional"
              />
            </div>
          )}
          {/* Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="space-y-2 py-2 text-red-500">
              {errors.postTitle?.type === 'required' && (
                <p>- A Post Title is Required</p>
              )}
              {errors.subreddit?.type === 'required' && (
                <p>- A Subreddit is Required</p>
              )}
            </div>
          )}
          {!!watch('postTitle') && (
            <button className="w-full rounded-full bg-blue-400 p-2 text-white">
              Create Post
            </button>
          )}
        </div>
      )}
    </form>
  )
}

export default PostBox
