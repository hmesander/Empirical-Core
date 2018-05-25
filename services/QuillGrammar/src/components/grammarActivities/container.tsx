import * as React from "react";
import * as Redux from "redux";
import {connect} from "react-redux";
import request from 'request';
import _ from 'lodash';
import getParameterByName from '../../helpers/getParameterByName';
import { startListeningToActivity } from "../../actions/grammarActivities";
import {
  updateSessionOnFirebase,
  startListeningToQuestions,
  goToNextQuestion,
  checkAnswer,
  setSessionReducerToSavedSession
} from "../../actions/session";
import { getConceptResultsForAllQuestions, calculateScoreForLesson } from '../../helpers/conceptResultsGenerator'
import Question from './question'
import { SessionState } from '../../reducers/sessionReducer'
import { GrammarActivityState } from '../../reducers/grammarActivitiesReducer'

interface PlayGrammarContainerProps {
  grammarActivities: GrammarActivityState;
  session: SessionState;
  dispatch: Function;
}

class PlayGrammarContainer extends React.Component<PlayGrammarContainerProps, any> {
    constructor(props: any) {
      super(props);

      this.saveToLMS = this.saveToLMS.bind(this)
      this.finishActivitySession = this.finishActivitySession.bind(this)
      this.createAnonActivitySession = this.createAnonActivitySession.bind(this)
    }

    componentWillMount() {
      const activityUID = getParameterByName('uid', window.location.href)
      const sessionID = getParameterByName('student', window.location.href)

      if (activityUID) {
        this.props.dispatch(startListeningToActivity(activityUID))
      }

      if (sessionID) {
        this.props.dispatch(setSessionReducerToSavedSession(sessionID))
      }
    }

    componentWillReceiveProps(nextProps: PlayGrammarContainerProps) {
      if (nextProps.grammarActivities.hasreceiveddata && !nextProps.session.hasreceiveddata && !nextProps.session.error) {
        const concepts = nextProps.grammarActivities.currentActivity.concepts
        this.props.dispatch(startListeningToQuestions(concepts))
      }

      if (nextProps.session.hasreceiveddata && !nextProps.session.currentQuestion && nextProps.session.unansweredQuestions.length === 0 && nextProps.session.answeredQuestions.length > 0) {
        this.saveToLMS(nextProps.session)
      } else if (nextProps.session.hasreceiveddata && !nextProps.session.currentQuestion) {
        this.props.dispatch(goToNextQuestion())
      }

      const sessionID = getParameterByName('student', window.location.href)
      if (sessionID && !_.isEqual(nextProps.session, this.props.session)) {
        updateSessionOnFirebase(sessionID, nextProps.session)
      }

    }

    saveToLMS(questions: SessionState) {
      const results = getConceptResultsForAllQuestions(questions.answeredQuestions);
      const score = calculateScoreForLesson(questions.answeredQuestions);
      const activityUID = getParameterByName('uid', window.location.href)
      const sessionID = getParameterByName('student', window.location.href)
      if (sessionID) {
        this.finishActivitySession(sessionID, results, score);
      } else {
        this.createAnonActivitySession(activityUID, results, score);
      }
    }

    finishActivitySession(sessionID: string, results, score) {
      request(
        { url: `${process.env.EMPIRICAL_BASE_URL}/api/v1/activity_sessions/${sessionID}`,
          method: 'PUT',
          json:
          {
            state: 'finished',
            concept_results: results,
            percentage: score,
          },
        },
        (err, httpResponse, body) => {
          if (httpResponse && httpResponse.statusCode === 200) {
            console.log('Finished Saving');
            console.log(err, httpResponse, body);
            const sessionID = getParameterByName('student', window.location.href)
            document.location.href = `${process.env.EMPIRICAL_BASE_URL}/activity_sessions/${sessionID}`;
            this.setState({ saved: true, });
          } else {
            this.setState({
              saved: false,
              error: true,
            });
          }
        }
      );
    }

    createAnonActivitySession(lessonID: string, results, score) {
      request(
        { url: `${process.env.EMPIRICAL_BASE_URL}/api/v1/activity_sessions/`,
          method: 'POST',
          json:
          {
            state: 'finished',
            activity_uid: lessonID,
            concept_results: results,
            percentage: score,
          },
        },
        (err, httpResponse, body) => {
          if (httpResponse.statusCode === 200) {
            console.log('Finished Saving');
            console.log(err, httpResponse, body);
            document.location.href = `${process.env.EMPIRICAL_BASE_URL}/activity_sessions/${body.activity_session.uid}`;
            this.setState({ saved: true, });
          }
        }
      );
    }

    render(): JSX.Element {
      if (this.props.grammarActivities.hasreceiveddata && this.props.session.hasreceiveddata && this.props.session.currentQuestion) {
        return <Question
          activity={this.props.grammarActivities.currentActivity}
          answeredQuestions={this.props.session.answeredQuestions}
          unansweredQuestions={this.props.session.unansweredQuestions}
          currentQuestion={this.props.session.currentQuestion}
          goToNextQuestion={() => this.props.dispatch(goToNextQuestion())}
          checkAnswer={(response, question) => this.props.dispatch(checkAnswer(response, question))}
        />
      } else if (this.props.session.error) {
        return (
          <div>{this.props.session.error}</div>
        );
      } else {
        return <div>Loading...</div>
      }
    }
}

const mapStateToProps = (state: any) => {
    return {
        grammarActivities: state.grammarActivities,
        session: state.session
    };
};

const mapDispatchToProps = (dispatch: Redux.Dispatch<any>) => {
    return {
        dispatch: dispatch
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(PlayGrammarContainer);