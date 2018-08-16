/* eslint-env browser*/
import _ from 'underscore';
import pathwaysActions from './pathways';
import { hashToCollection } from 'quill-component-library/dist/componentLibrary';
import request from 'request';
import objectWithSnakeKeysFromCamel from '../libs/objectWithSnakeKeysFromCamel';

import { ActionTypes } from './actionTypes'
const moment = require('moment');

export function deleteStatus(questionId) {
  return { type: ActionTypes.DELETE_RESPONSE_STATUS, data: { questionId, }, };
}

export function updateStatus(questionId, status) {
  return { type: ActionTypes.UPDATE_RESPONSE_STATUS, data: { questionId, status, }, };
}

export function updateData(questionId, responses) {
  return { type: ActionTypes.UPDATE_RESPONSE_DATA, data: { questionId, responses, }, };
}

function responsesForQuestionRef(questionId) {
  return responsesRef.orderByChild('questionUID').equalTo(questionId);
}

function getQuestionLoadedStatusForGroupedResponses(groupedResponses) {
  const questionsKeys = _.keys(groupedResponses);
  const statuses = {};
  questionsKeys.forEach((key) => {
    statuses[key] = 'LOADED';
  });
  console.log(statuses);
  return statuses;
}

export function submitResponse(content, prid, isFirstAttempt) {
  delete content.gradeIndex;
  const rubyConvertedResponse = objectWithSnakeKeysFromCamel(content);
  rubyConvertedResponse.created_at = moment().format('x');
  rubyConvertedResponse.first_attempt_count = isFirstAttempt ? 1 : 0;
  rubyConvertedResponse.is_first_attempt = isFirstAttempt;
  return (dispatch) => {
    request.post({
      url: `${process.env.QUILL_CMS}/responses/create_or_increment`,
      form: { response: rubyConvertedResponse, }, },
      (error, httpStatus, body) => {
        if (error) {
          dispatch({ type: ActionTypes.DISPLAY_ERROR, error: `Submission failed! ${error}`, });
        } else if (httpStatus.statusCode === 204 || httpStatus.statusCode === 200) {
          dispatch({ type: ActionTypes.DISPLAY_MESSAGE, message: 'Submission successfully saved!', });
        } else {
          console.log(body);
        }
      },
    );
  };
}

export function submitMassEditFeedback(ids, properties, qid) {
  return (dispatch) => {
    const updated_attribute = properties;
    console.log(updated_attribute);
    request.put({
      url: `${process.env.QUILL_CMS}/responses/mass_edit/edit_many`,
      json: { ids, updated_attribute, }, },
      (error, httpStatus, body) => {
        if (error) {
          dispatch({ type: ActionTypes.DISPLAY_ERROR, error: `Submission failed! ${error}`, });
        } else if (httpStatus.statusCode === 204 || httpStatus.statusCode === 200) {
          dispatch({ type: ActionTypes.DISPLAY_MESSAGE, message: 'Submission successfully saved!', });
          dispatch({ type: ActionTypes.SHOULD_RELOAD_RESPONSES, qid, });
        } else {
          console.log(body);
        }
      });
  };
}

export function submitMassEditConceptResults(ids, conceptResults, qid) {
  return (dispatch) => {
    const updated_attribute = {
      concept_results: conceptResults,
    };
    request.put({
      url: `${process.env.QUILL_CMS}/responses/mass_edit/edit_many`,
      json: { ids, updated_attribute, }, },
      (error, httpStatus, body) => {
        if (error) {
          dispatch({ type: ActionTypes.DISPLAY_ERROR, error: `Submission failed! ${error}`, });
        } else if (httpStatus.statusCode === 204 || httpStatus.statusCode === 200) {
          dispatch({ type: ActionTypes.DISPLAY_MESSAGE, message: 'Submission successfully saved!', });
          dispatch({ type: ActionTypes.SHOULD_RELOAD_RESPONSES, qid, });
        } else {
          console.log(body);
        }
      });
  };
}

export function massEditDeleteResponses(ids, qid) {
  return (dispatch) => {
    request.post({
      url: `${process.env.QUILL_CMS}/responses/mass_edit/delete_many`,
      json: { ids, }, },
      (error, httpStatus, body) => {
        if (error) {
          dispatch({ type: ActionTypes.DISPLAY_ERROR, error: `Submission failed! ${error}`, });
        } else if (httpStatus.statusCode === 204 || httpStatus.statusCode === 200) {
          dispatch({ type: ActionTypes.DISPLAY_MESSAGE, message: 'Submission successfully saved!', });
          dispatch({ type: ActionTypes.SHOULD_RELOAD_RESPONSES, qid, });
        } else {
          console.log(body);
        }
      });
  };
}

export function submitResponseEdit(rid, content, qid) {
  const rubyConvertedResponse = objectWithSnakeKeysFromCamel(content, false);
  return (dispatch) => {
    request.put({
      url: `${process.env.QUILL_CMS}/responses/${rid}`,
      form: { response: rubyConvertedResponse, }, },
      (error, httpStatus, body) => {
        if (error) {
          dispatch({ type: ActionTypes.DISPLAY_ERROR, error: `Submission failed! ${error}`, });
        } else if (httpStatus.statusCode === 204 || httpStatus.statusCode === 200) {
          dispatch({ type: ActionTypes.DISPLAY_MESSAGE, message: 'Submission successfully saved!', });
          dispatch({ type: ActionTypes.SHOULD_RELOAD_RESPONSES, qid, });
        } else {
          console.log(body);
        }
      });
  };
}

export function updateConceptResults(rid, content, qid) {
  const rubyConvertedResponse = objectWithSnakeKeysFromCamel(content, false);
  return (dispatch) => {
    request.put({
      url: `${process.env.QUILL_CMS}/responses/${rid}`,
      json: { response: rubyConvertedResponse, }, },
      (error, httpStatus, body) => {
        if (error) {
          dispatch({ type: ActionTypes.DISPLAY_ERROR, error: `Submission failed! ${error}`, });
        } else if (httpStatus.statusCode === 204 || httpStatus.statusCode === 200) {
          dispatch({ type: ActionTypes.DISPLAY_MESSAGE, message: 'Submission successfully saved!', });
          dispatch({ type: ActionTypes.SHOULD_RELOAD_RESPONSES, qid, });
          dispatch({ type: ActionTypes.START_RESPONSE_EDIT, qid, rid, });
        } else {
          console.log(body);
        }
      });
  };
}

export function deleteConceptResult(rid, content, qid) {
  const updatedResponse = objectWithSnakeKeysFromCamel(content, false);
  return (dispatch) => {
    request.put({
      url: `${process.env.QUILL_CMS}/responses/${rid}`,
      form: { response: updatedResponse, }, },
      (error, httpStatus, body) => {
        if (error) {
          dispatch({ type: ActionTypes.DISPLAY_ERROR, error: `Submission failed! ${error}`, });
        } else if (httpStatus.statusCode === 204 || httpStatus.statusCode === 200) {
          dispatch({ type: ActionTypes.DISPLAY_MESSAGE, message: 'Submission successfully saved!', });
          dispatch({ type: ActionTypes.SHOULD_RELOAD_RESPONSES, qid, });
          dispatch({ type: ActionTypes.START_RESPONSE_EDIT, qid, rid, });
        } else {
          console.log(body);
        }
      });
  };
}

export function deleteResponse(qid, rid) {
  return (dispatch) => {
    request.delete(
      `${process.env.QUILL_CMS}/responses/${rid}`,
      (error, httpStatus, body) => {
        if (error) {
          dispatch({ type: ActionTypes.DISPLAY_ERROR, error: `Submission failed! ${error}`, });
        } else if (httpStatus.statusCode === 204 || httpStatus.statusCode === 200) {
          dispatch({ type: ActionTypes.DISPLAY_MESSAGE, message: 'Submission successfully saved!', });
          dispatch({ type: ActionTypes.SHOULD_RELOAD_RESPONSES, qid, });
        } else {
          console.log(body);
        }
      },
    );
  };
}

function makeIterator(array) {
  let nextIndex = 0;

  return {
    next() {
      return nextIndex < array.length ?
               { value: array[nextIndex++], done: false, } :
               { done: true, };
    },
  };
}

export function getGradedResponsesWithCallback(questionID, callback) {
  request(`${process.env.QUILL_CMS}/questions/${questionID}/responses`, (error, response, body) => {
    if (error) {
      console.log('error:', error); // Print the error if one occurred
    }
    const bodyToObj = {};
    JSON.parse(body).forEach((resp) => {
      bodyToObj[resp.id] = resp;
      if (typeof resp.concept_results === 'string') {
        resp.concept_results = JSON.parse(resp.concept_results);
      }
      for (const cr in resp.concept_results) {
        const formatted_cr = {};
        formatted_cr.conceptUID = cr;
        formatted_cr.correct = resp.concept_results[cr];
        resp.concept_results[cr] = formatted_cr;
      }
      resp.conceptResults = resp.concept_results;
      delete resp.concept_results;
    });
    callback(bodyToObj);
  });
}

export function getGradedResponsesWithoutCallback(questionID) {
  request(`${process.env.QUILL_CMS}/questions/${questionID}/responses`, (error, response, body) => {
    if (error) {
      console.log('error:', error); // Print the error if one occurred
    }
    const bodyToObj = {};
    JSON.parse(body).forEach((resp) => {
      bodyToObj[resp.id] = resp;
      if (typeof resp.concept_results === 'string') {
        resp.concept_results = JSON.parse(resp.concept_results);
      }
      for (const cr in resp.concept_results) {
        const formatted_cr = {};
        formatted_cr.conceptUID = cr;
        formatted_cr.correct = resp.concept_results[cr];
        resp.concept_results[cr] = formatted_cr;
      }
      resp.conceptResults = resp.concept_results;
      delete resp.concept_results;
    });
    return bodyToObj;
  });
}