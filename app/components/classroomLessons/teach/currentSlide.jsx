import * as React from 'react';
import { connect } from 'react-redux';
import {
  startListeningToSessionWithoutCurrentSlide,
  startListeningToCurrentSlide,
  saveSelectedStudentSubmission,
  removeSelectedStudentSubmission,
  setMode,
  removeMode,
  toggleOnlyShowHeaders,
  clearAllSelectedSubmissions,
  clearAllSubmissions,
  updateSlideInFirebase
} from '../../../actions/classroomSessions';
import CLLobby from './lobby';
import CLStatic from './static.jsx';
import CLSingleAnswer from './singleAnswer.jsx';
import { getParameterByName } from 'libs/getParameterByName';
import {
  SelectedSubmissions,
  SelectedSubmissionsForQuestion,
} from '../interfaces';

class CurrentSlide extends React.Component<any, any> {
  constructor(props) {
    super(props);
    this.toggleSelected = this.toggleSelected.bind(this);
    this.startDisplayingAnswers = this.startDisplayingAnswers.bind(this);
    this.stopDisplayingAnswers = this.stopDisplayingAnswers.bind(this);
    this.toggleOnlyShowHeaders = this.toggleOnlyShowHeaders.bind(this);
    this.clearAllSelectedSubmissions = this.clearAllSelectedSubmissions.bind(this);
    this.clearAllSubmissions = this.clearAllSubmissions.bind(this);
  }

  componentDidUpdate(prevProps) {
    const caId: string|null = getParameterByName('classroom_activity_id');
    console.log(prevProps.classroomSessions.data.current_slide, this.props.classroomSessions.data.current_slide, prevProps.classroomSessions.data.current_slide !== this.props.classroomSessions.data.current_slide);
    if (prevProps.classroomSessions.data.current_slide !== this.props.classroomSessions.data.current_slide) {
      updateSlideInFirebase(caId, this.props.classroomSessions.data.current_slide);
    }
  }

  toggleSelected(current_slide: string, student: string) {
    const caId: string|null = getParameterByName('classroom_activity_id');
    if (caId) {
      const submissions: SelectedSubmissions | null = this.props.classroomSessions.data.selected_submissions;
      const currentSlide: SelectedSubmissionsForQuestion | null = submissions ? submissions[current_slide] : null;
      const currentValue: boolean | null = currentSlide ? currentSlide[student] : null;
      if (!currentValue) {
        saveSelectedStudentSubmission(caId, current_slide, student);
      } else {
        removeSelectedStudentSubmission(caId, current_slide, student);
      }
    }
  }

  clearAllSelectedSubmissions(current_slide: string) {
    const caId: string|null = getParameterByName('classroom_activity_id');
    if (caId) {
      clearAllSelectedSubmissions(caId, current_slide);
    }
  }

  clearAllSubmissions(current_slide: string) {
    const caId: string|null = getParameterByName('classroom_activity_id');
    if (caId) {
      clearAllSubmissions(caId, current_slide);
    }
  }

  toggleOnlyShowHeaders() {
    this.props.dispatch(toggleOnlyShowHeaders());
  }

  startDisplayingAnswers() {
    const caId: string|null = getParameterByName('classroom_activity_id');
    if (caId) {
      setMode(caId, this.props.classroomSessions.data.current_slide, 'PROJECT');
    }
  }

  stopDisplayingAnswers() {
    const caId: string|null = getParameterByName('classroom_activity_id');
    if (caId) {
      removeMode(caId, this.props.classroomSessions.data.current_slide);
    }
  }

  render() {
    const data = this.props.classroomSessions.data;
    if (this.props.classroomSessions.hasreceiveddata) {
      const current = data.questions[data.current_slide || '0'];
      switch (current.type) {
        case 'CL-LB':
          return (
            <CLLobby data={data} slideData={current} />
          );
        case 'CL-ST':
          return (
            <CLStatic
              data={data}
              toggleOnlyShowHeaders={this.toggleOnlyShowHeaders}
              onlyShowHeaders={this.props.classroomSessions.onlyShowHeaders}
            />
          );
        case 'CL-SA':
          return (
            <CLSingleAnswer
              data={data}
              toggleSelected={this.toggleSelected}
              startDisplayingAnswers={this.startDisplayingAnswers}
              stopDisplayingAnswers={this.stopDisplayingAnswers}
              toggleOnlyShowHeaders={this.toggleOnlyShowHeaders}
              clearAllSelectedSubmissions={this.clearAllSelectedSubmissions}
              clearAllSubmissions={this.clearAllSubmissions}
              onlyShowHeaders={this.props.classroomSessions.onlyShowHeaders}
            />
          );
        default:
      }
    } else {
      return <p>Hi</p>;
    }
  }

}

function select(props) {
  return {
    classroomSessions: props.classroomSessions,
  };
}

export default connect(select)(CurrentSlide);
