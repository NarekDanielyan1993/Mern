import React, { Component } from 'react';
import axios from "../../../util/axiosConfig";

import Image from '../../../components/Image/Image';
import './SinglePost.css';

class SinglePost extends Component {
  state = {
    title: '',
    author: '',
    date: '',
    image: '',
    content: '',
    isError: null,
    errorMessage: null
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;
    console.log(this.props.token)
    axios.post(`/feed/post/${postId}`, {data: {}}, { headers: {
      "Authorization" : 'Bearer '+ this.props.token
    }})
      .then((response) => {
        const post = response.data.post; 
        this.setState({
          title: post.title,
          author: post.creator.name,
          date: post.createdAt,
          image: post.image.url,
          content: post.content
        })
      }).catch((err) => {
        console.log(err.response)
        this.setState({isError: true, errorMessage: err.response.data.message})
      });
  }

  render() {
    return (
      (!this.state.isError ? <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.image} />
        </div>
        <p>{this.state.content}</p>
      </section>
      : this.state.errorMessage)
    );
  }
}

export default SinglePost;
