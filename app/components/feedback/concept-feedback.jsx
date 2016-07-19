import React from 'react'
import C from '../../constants'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import actions from '../../actions/concepts-feedback'
import feedbackActions from '../../actions/concepts-feedback'
import _ from 'underscore'
import {hashToCollection} from '../../libs/hashToCollection'
import FeedbackForm from './feedbackForm.jsx'

const ConceptFeedback = React.createClass({

  deleteConceptsFeedback: function () {
    this.props.dispatch(actions.deleteConceptsFeedback(this.props.params.feedbackID))
  },

  toggleEdit: function () {
    this.props.dispatch(actions.startConceptsFeedbackEdit(this.props.params.feedbackID))
  },

  submitNewFeedback: function (feedbackID, newFeedbackText) {
    if(newFeedbackText !== '') {
      this.props.dispatch(feedbackActions.submitConceptsFeedbackEdit(feedbackID, {
        feedbackText: newFeedbackText})
      )
    }
  },

  cancelEdit: function() {
      this.props.dispatch(actions.cancelConceptsFeedbackEdit(this.props.feedbackID.feedbackID))
  },

  render: function (){
    const {data, states} = this.props.conceptsFeedback;
    const {feedbackID} = this.props.params;

    if (data[feedbackID]) {
      const isEditing = (states[feedbackID] === C.START_CONCEPTS_FEEDBACK_EDIT);
      if (isEditing) {
        return (
          <div>
            <h4 className="title">{data[feedbackID].name}</h4>
            <FeedbackForm feedbackText={data[feedbackID].feedbackText} feedbackID={feedbackID} submitNewFeedback={this.submitNewFeedback}/>
          </div>
        )
      } else {
        return (
          <div>
            <h4 className="title">{data[feedbackID].name}</h4>
            <p>{data[feedbackID].feedbackText}</p>
            <p className="control">
              <button className="button is-info" onClick={this.toggleEdit}>Edit Feedback</button> <button className="button is-danger" onClick={this.deleteConceptsFeedback}>Delete Concept</button>
            </p>
          </div>
        )
      }

    } else if (this.props.concepts.hasreceiveddata === false){
      return (<p>Loading...</p>)
    } else {
      return (
        <p>404: No Concept Found</p>
      )
    }

  }
})

function select(state) {
  return {
    concepts: state.concepts,
    conceptsFeedback: state.conceptsFeedback,
    questions: state.questions,
    routing: state.routing
  }
}

export default connect(select)(ConceptFeedback)
