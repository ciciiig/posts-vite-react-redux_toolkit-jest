import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../app/store"
import config from "../../../config.json"
import { SinglePostWindowState } from "../singlePostWindow/singlePostWindowSlice"

export interface PostsState {
  allPosts: Post[]
  status: "idle" | "loading" | "failed"
  error: string | undefined
  currentPosts: Post[]
  maxPostsPerPage: number
  searchValue: string
}

export interface Post {
  userId: number
  id: number
  title: string
  body: string
}

export interface UpdatedPostBody {
  id: number
  body: string
}

const initialState: PostsState = {
  allPosts: [],
  status: "idle",
  error: undefined,
  currentPosts: [],
  maxPostsPerPage: config.maxPostsPerPage,
  searchValue: "",
}

export const fetchPosts = createAsyncThunk("posts/fetchPosts", async () => {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts")
  return await response.json()
})

export const patchPost = createAsyncThunk(
  "posts/patchPost",
  async (postToUpdate: SinglePostWindowState) => {
    const urlPost = `https://jsonplaceholder.typicode.com/posts/${postToUpdate.clickedPostId}`
    const payload = postToUpdate.editedPost
    const options = {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "Content-type": "application/json; charset=UTF-8" },
    }

    const response = await fetch(urlPost, options)
    return await response.json()
  },
)

export const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    setCurrentPosts(state, action: PayloadAction<Post[]>) {
      state.currentPosts = action.payload
    },
    setSearchValue(state, action: PayloadAction<PostsState["searchValue"]>) {
      state.searchValue = action.payload
    },
    updatePostBody(state, action: PayloadAction<UpdatedPostBody>) {
      const { id, body } = action.payload
      const existingPost = state.allPosts.find((post) => post.id === id)

      if (existingPost) {
        existingPost.body = body
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.status = "loading"
      })
      .addCase(fetchPosts.fulfilled, (state, action: PayloadAction<Post[]>) => {
        state.status = "idle"
        state.allPosts = action.payload
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = "failed"
        state.error = `${action.error.name}: ${action.error.message}`
      })
      .addCase(patchPost.pending, (state) => {
        state.status = "loading"
      })
      .addCase(
        patchPost.fulfilled,
        (state, action: PayloadAction<SinglePostWindowState>) => {
          state.status = "idle"
          const editedPost = action.payload.editedPost
          if (editedPost && editedPost.body !== undefined) {
            updatePostBody({ id: editedPost.id, body: editedPost.body })
          }
        },
      )
      .addCase(patchPost.rejected, (state, action) => {
        state.status = "failed"
        state.error = `${action.error.name}: ${action.error.message}`
        const { id, body } = action.meta.arg.editedPost
        const existingPost = state.allPosts.find((post) => post.id === id)

        if (existingPost) {
          existingPost.body = body
        }
        // TODO: dissapear alert after 5 seconds
        // setTimeout(() => {
        //   state.status = "idle"
        //   console.log(state.status)
        // }, 2000)
      })
  },
})

export const { setCurrentPosts, setSearchValue, updatePostBody } =
  postsSlice.actions

export const selectPosts = (state: RootState) => state.posts

export default postsSlice.reducer
