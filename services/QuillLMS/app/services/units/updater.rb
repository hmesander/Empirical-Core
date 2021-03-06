module Units::Updater
  # in this file, 'unit' refers to a unit object, 'activities_data' to an array of objects
  # with activity ids and due_dates, and 'classrooms_data' to an array of objects with an id
  # and array of student ids.

  # TODO: rename this -- it isn't always the method called on the instance
  def self.run(unit_id, activities_data, classrooms_data, current_user_id=nil)
    self.update_helper(unit_id, activities_data, classrooms_data, current_user_id)
  end

  def self.assign_unit_template_to_one_class(unit_id, classrooms_data, unit_template_id, current_user_id=nil)
    classroom_array = [classrooms_data]
    # converted to array so we can map in helper function as we would otherwise
    unit_template = UnitTemplate.find(unit_template_id)
    activities_data = unit_template.activities.map{ |a| {id: a.id, due_date: nil} }
    self.update_helper(unit_id, activities_data, classroom_array, current_user_id)
  end

  def self.fast_assign_unit_template(teacher_id, unit_template, unit_id, current_user_id=nil)
    activities_data = unit_template.activities.select('activities.id AS id, NULL as due_date')
    classrooms_data = User.find(teacher_id).classrooms_i_teach.map{|classroom| {id: classroom.id, student_ids: [], assign_on_join: true}}
    self.update_helper(unit_id, activities_data, classrooms_data, current_user_id || teacher_id)
  end

  private

  def self.matching_or_new_classroom_unit(classroom, extant_classroom_units, new_cus, hidden_cus_ids, unit_id)
    classroom_id = classroom[:id].to_i
    matching_cu = extant_classroom_units.find{|cu| cu.classroom_id == classroom_id}
    if matching_cu
      if classroom[:student_ids] == false
        # then there are no assigned students and we should hide the cas
        hidden_cus_ids.push(matching_cu.id)
      elsif (matching_cu.assigned_student_ids != classroom[:student_ids]) || matching_cu.assign_on_join != classroom[:assign_on_join]
        # then something changed and we should update
        matching_cu.update!(assign_on_join: classroom[:assign_on_join], assigned_student_ids: classroom[:student_ids], visible: true)
      elsif !matching_cu.visible
        matching_cu.update!(visible: true)
      end
    elsif classroom[:student_ids] || classroom[:assign_on_join]
      # making an array of hashes to create in one bulk option
      new_cus.push({classroom_id: classroom_id,
         unit_id: unit_id,
         assign_on_join: classroom[:assign_on_join],
         assigned_student_ids: classroom[:student_ids]})
    end
  end

  def self.matching_or_new_unit_activity(activity_data, extant_unit_activities, new_uas, hidden_ua_ids, unit_id)
    matching_ua = extant_unit_activities.find{|ua| (ua.activity_id == activity_data[:id])}
    if matching_ua
      if matching_ua[:due_date] != activity_data[:due_date]
        # then something changed and we should update
        matching_ua.update!(due_date: activity_data[:due_date], visible: true)
      elsif !matching_ua.visible
        matching_ua.update!(visible: true)
      end
    elsif activity_data[:id]
      # making an array of hashes to create in one bulk option
      new_uas.push({activity_id: activity_data[:id],
         unit_id: unit_id,
         due_date: activity_data[:due_date]})
    end
  end

  def self.update_helper(unit_id, activities_data, classrooms_data, current_user_id)
    extant_classroom_units = ClassroomUnit.where(unit_id: unit_id)
    new_cus = []
    hidden_cus_ids = []
    extant_unit_activities = UnitActivity.where(unit_id: unit_id)
    new_uas = []
    hidden_ua_ids = []
    classrooms_data.each do |classroom|
      self.matching_or_new_classroom_unit(classroom, extant_classroom_units, new_cus, hidden_cus_ids, unit_id)
    end
    activities_data.each do |activity|
      self.matching_or_new_unit_activity(activity, extant_unit_activities, new_uas, hidden_ua_ids, unit_id)
    end
    new_cus.uniq.each{|cu| ClassroomUnit.create(cu)}
    hidden_cus_ids.each{|cu_id| ClassroomUnit.find_by_id(cu_id)&.update(visible: false)}
    new_uas.uniq.each{|ua| UnitActivity.create(ua)}
    hidden_ua_ids.each{|ua_id| UnitActivity.find_by_id(ua_id)&.update(visible: false)}
    unit = Unit.find unit_id
    if (hidden_ua_ids.any?) && (new_uas.none?)
      unit.hide_if_no_visible_unit_activities
    end
    AssignActivityWorker.perform_async(current_user_id)
  end

end
