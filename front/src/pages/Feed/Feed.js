import React, { Component, Fragment } from 'react';
import openSocket from "socket.io-client";

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';

import axios from "../../util/axiosConfig";

import './Feed.css';

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false,
    statusLoading: false
  };

  componentDidMount() {
      axios.get("/user", { headers: {
        "Authorization" : 'Bearer '+ this.props.token
      }})                                                         
      .then(res => {
        return res.data;
      })
      .then(resData => {
        this.setState({ status: resData.user.status });
      })
      .catch(err => {
        if(err.response) {
          this.setState({
              error: err.response.data
          })
        } else if(err.request) {
            console.log(err.request)
        } else {
            console.log(err)
        }
      })
      this.loadPosts();
      const socket = openSocket("http://localhost:8080")
      socket.on("posts", data => {
        console.log(data)
        if("create" === data.action) {
            this.addPost(data.post)
        } else if("update" === data.action) {
            this.updatePost(data.post) 
        } else if ("delete" === data.action) {
            this.deletePost(data.post._id)
        }
      })
  }

  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;
    if (direction === 'next') {
      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }
    axios.get("/feed/posts", {headers: {
      "Authorization" : 'Bearer '+ this.props.token
    }})
    .then((response) => {
      console.log(response.data)
      this.setState({
              posts: response.data.posts,
              totalPosts: response.data.posts.length,
              postsLoading: false
            });
    })
    .catch((err) => {
      console.log(err.response)
      this.setState({
        error: err.response || "",
        postsLoading: false
      })
    });
  };

  addPost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      if (prevState.postPage === 1) {
        if (prevState.posts.length >= 2) {
          updatedPosts.pop();
        }
        updatedPosts.unshift(post);
      }
      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts + 1
      };
    })
  };

  updatePost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      const updatedPostIndex = updatedPosts.findIndex(p => p._id === post._id);
      if (updatedPostIndex > -1) {
        updatedPosts[updatedPostIndex] = post;
      }
      return {
        posts: updatedPosts,
        isEditing: false,
        editPost: null,
        editLoading: false
      };
    });
  };

  deletePost = postId => {
    this.setState(prevState => {
      const updatedPosts = prevState.posts.filter(p => p._id !== postId);
      return { posts: updatedPosts, postsLoading: false };
    });
  }
  
  statusUpdateHandler = (event, value) => {
    event.preventDefault();
    this.setState({statusLoading: true})
    axios({method: "GET", url: `/newStatus?status=${value}`, data: {}, headers: {
      "Authorization" : 'Bearer '+ this.props.token
    }})
    .then(response => {
      this.setState({status: response.data.user.status, statusLoading: false})
    })
    .catch((err) => {
      if(err.response) {
        this.setState({
          statusLoading: false,
          error: err.response.data
        })
      } else if(err.request) {
        this.setState({
          statusLoading: false,
          error: err.request.data
        })
      } else {
        console.log(err)
      }
    });
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };
      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = postData => {
    let image = postData.image;
    if(!postData.image) {
      image = null;
    } 
    this.setState({
      editLoading: true
    });
    const formData = new FormData()   
    formData.append("title", postData.title)
    formData.append("content", postData.content)
    formData.append("image", image)

    let request_method = "post";
    let url = "/feed/post"
    if(this.state.editPost) {
      const postId = this.state.editPost._id
      request_method = "put";
      url = `/feed/post/${postId}`;   
    }
    axios({method: request_method, url: url, data: formData, headers: {
      "Authorization" : 'Bearer '+ this.props.token
    }})
    .then((response) => {
      return response.data.post;
    })
    .catch(err => {
      if(err.response) {
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err.response.data
        })
      } else if(err.request) {
        console.log(err.request)
      } else {
        console.log(err)
      }
    })
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });
    axios({method: "DELETE", url: `/feed/post/${postId}`, headers: {
      "Authorization" : 'Bearer '+ this.props.token
    }})
    .then(res => {
      return res.data;
    })
    .catch(err => {                                    
      console.log(err);
      if(err.response) {
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          postsLoading: false,
          error: err.response.data
        })
      } else if(err.request){
        console.log(err.request)
      } else {
        console.log(err)
      }
    });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          {!this.state.statusLoading ? <form onSubmit={(e) => this.statusUpdateHandler(e, this.state.status)}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form> :  <div style={{textAlign: "center"}}><Loader /></div>}
        </section> 
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / 2)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('am-AR')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
