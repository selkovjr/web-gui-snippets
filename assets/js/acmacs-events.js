/*
  # license
  # license.
*/

/*jslint plusplus: false*/

// ======================================================================

Y.namespace('ACMACS');

Y.namespace('ACMACS').events =
{
  ACMACS_LOGO_CLICKED: Y.publish('acmacs-logo'),

  // Session
  LOGGED_IN: Y.publish('acmacs:logged-in'),
  LOGGED_OUT: Y.publish('acmacs:logged-out'),
  SERVER_RESPONSE_BROKEN: Y.publish('acmacs:server-response-broken'), // cannot parse json in the server response
  SERVER_REPORTS_ERROR: Y.publish('acmacs:server-reports-error'), // fired for each error in the listp reported by server
  SERVER_COMMUNICATION_FAILURE: Y.publish('acmacs:server-communication-failure'), // timeout, server disappeared
  SESSION_EXPIRED: Y.publish('acmacs:session-expired'),
  LOGIN_CREDENTIALS_NEEDED: Y.publish('acmacs:login-credentials-needed'),
  LOGIN_INVALID_CREDENTIALS: Y.publish('acmacs:login-invalid-credentials'),
  LOGOUT: Y.publish('acmacs:logout'),
  // messages for communication report
  LOGGING_IN: Y.publish('acmacs:logging-in'),
  SUBMITTING_COMMAND: Y.publish('acmacs:submitting-command'),
  SERVER_COMMUNICATION_COMPLETED: Y.publish('acmacs:server-communication-completed'),

  // acmacs-login
  REQUEST_REGISTRATION: Y.publish('acmacs:register'),
  REPORT_PROBLEM: Y.publish('acmacs:report-problems'),
  FORGOT_PASSWORD: Y.publish('acmacs:forgot-password'),

  // user menu
  OPEN_USER_SETTINGS: Y.publish('acmacs:open-user-settings'),
  PERFORM_LOGIN_AS: Y.publish('acmacs:perform-login-as'),
  OPEN_ACCOUNTS_EDITOR: Y.publish('acmacs:open-accounts-editor'),

  // commands
  COMMAND_HELP: Y.publish('acmacs:command-help'),
  COMMAND_TEST: Y.publish('acmacs:command-test'),
  SHOW_CHART_SELECTOR_PANEL: Y.publish('acmacs:show-chart-selector-panel'),
  SHOW_PAGE_SELECTOR_PANEL: Y.publish('acmacs:show-page-selector-panel'),
  OPEN_CHART: Y.publish('acmacs:open-chart'),
  FIND_OPEN_CHART: Y.publish('acmacs:find-open-chart'),
  OPEN_PAGE: Y.publish('acmacs:open-page'),
  CLOSE_PAGE: Y.publish('acmacs:close-page'),
  SAVE_PAGE: Y.publish('acmacs:save-page'),
  SAVE_PAGE_AS: Y.publish('acmacs:save-page-as'),
  DELETE_PAGE: Y.publish('acmacs:delete-page'),
  SHOW_UPLOAD_DIALOG: Y.publish('acmacs:show-upload-dialog'),
  CREATE_NEW_CHART: Y.publish('acmacs:create_new_chart'),
  DELETE_CHART: Y.publish('acmacs:delete-chart'),
  CHANGE_PASSWORD: Y.publish('acmacs:change_password'),
  INVALID_LINK: Y.publish('acmacs:invalid_link'),

  NEW_CHAIN: Y.publish('acmacs:new_chain'),
  SHOW_CHAIN_SELECTOR_PANEL: Y.publish('acmacs:show_chain_selector_panel'),
  CHAIN_CHOSEN: Y.publish('acmacs:chain_chosen'),
  DELETE_CHAIN: Y.publish('acmacs:delete_chain'),
  OPEN_CHAIN: Y.publish('acmacs:open_chain'),
  SHOW_CHAIN_EDITOR: Y.publish('acmacs:show_chain_editor'),
  CHAIN_UPDATED: Y.publish('acmacs:chain_updated'),
  CHAIN_INFO_UPDATED: Y.publish('acmacs.chain_info_updated'),

  // widget-to-widget communication
  SELECTOR_INPUT_FILTER_UPDATED: Y.publish('acmacs:selector-input-filter-updated'),
  SELECTOR_NEXT_PAGE: Y.publish('acmacs:selector-next-page'),
  SELECTOR_PREV_PAGE: Y.publish('acmacs:selector-prev-page'),
  COMMAND_HELP_MODAL_HIDDEN: Y.publish('acmacs:command-help-modal-hidden'),
  CHART_CHOSEN: Y.publish('acmacs:chart-chosen'),
  CHART_CHOSEN_FOR_PROCRUSTES: Y.publish('acmacs:chart_chosen_for_procrustes'),
  PAGE_CHOSEN: Y.publish('acmacs:page-chosen'),
  WRENCH_MENU_SHOW: Y.publish('acmacs:wrench-menu-show'),
  WRENCH_MENU_CLICKED: Y.publish('acmacs:wrench-menu-clicked'),
  POPUP_MENU_HIDDEN: Y.publish('acmacs:popup-menu-hidden'),
  COMMAND_INPUT_INSERT: Y.publish('acmacs:command-input-insert'),
  COMMAND_UNRECOGNIZED: Y.publish('acmacs:command-unrecognized'),
  WINDOW_SCROLLED: Y.publish('acmacs:window-scrolled'),
  WIDGET_TITLE_SET: Y.publish('acmacs:widget-title-set'),
  WIDGET_CLOSE: Y.publish('acmacs:widget-close'),
  WIDGET_EXPAND_COLLAPSE: Y.publish('acmacs:widget-expand-collapse'),
  WIDGET_EXPAND: Y.publish('acmacs:widget-expand'),
  WIDGET_COLLAPSE: Y.publish('acmacs:widget-collapse'),
  WIDGET_EXPANDED: Y.publish('acmacs:widget_expanded'),
  WIDGET_COLLAPSED: Y.publish('acmacs:widget_collapsed'),
  SUBWIDGET_ADDED: Y.publish('acmacs:subwidget-added'),
  WIDGET_SIZE_ADJUSTED: Y.publish('acmacs:widget-size-adjusted'),
  RESIZABLE_RESIZE: Y.publish('acmacs:resizable-resize'),
  RESIZABLE_RESIZE_END: Y.publish('acmacs:resizable-resize-end'),
  WIDGET_STATUS_LINE_MESSAGE: Y.publish('acmacs:widget_status_line_message'),
  MAP_WIDGET_HELP_MODAL_HIDDEN: Y.publish('acmacs:map_widget_help_modal_hidden'),
  MODAL_QUERY_BUTTON_CLICKED: Y.publish('acmacs:modal_query_button_clicked'),
  // MAP_WIDGET_LAYOUT_CHANGED: Y.publish('acmacs:map_widget_layout_changed'),
  LEVEL_HEADER_RENDERED: Y.publish('acmacs:level_header_rendered'),
  PAGE_SAVED: Y.publish('acmacs:page_saved'),
  TABLE_CELL_VALUE_CHANGED: Y.publish('acmacs:table_cell_value_changed'),
  TABLE_CELL_GO_TO_NEXT_FIELD: Y.publish('acmacs:table_cell_go_to_next_field'),
  TABLE_CONFORMANCE_UPDATED: Y.publish('acmacs:table_conformance_updated'),
  CHART_MAP_SET_CHANGED: Y.publish('acmacs:chart_map_set_changed'),
  EMAIL_PAGE_LINK: Y.publish('acmacs:email_page_link'),
  LOGIN_AS_BUTTON_CLICKED: Y.publish('acmacs:login_as_button_clicked'),
  CHAIN_PRELOAD: Y.publish('acmacs:chain_preload'),
  ATTACHED_TO_REPOSITIONED: Y.publish('acmacs:attached_to_repositioned'),

  // sub-widgets
  // SHOW_ROUTINE_DIAGNOSTICS_INSPECTOR: Y.publish('acmacs:show-routine-diagnostics-inspector'), // lemon only
  SHOW_RUNNING_TASKS: Y.publish('acmacs:show-running-tasks'), // cherry
  SHOW_ROUTINE_DIAGNOSTICS_LOG_INSPECTOR: Y.publish('acmacs:show-routine-diagnostics-log-inspector'),
  HIDE_ROUTINE_DIAGNOSTICS_LOG_INSPECTOR: Y.publish('acmacs:hide-routine-diagnostics-log-inspector'),
  CHART_UPDATE: Y.publish('acmacs:chart-update'),
  ACCCOUNT_GROUP_LIST_UPDATED: Y.publish('acmacs:acccount-group-list-updated'),

   // obsolete (as of cherry)
  REMOVE_INSPECTOR: Y.publish('acmacs:remove-inspector'),

  last: null
};

/*======================================================================
 * Local Variables:
 * indent-tabs-mode: nil
 * tab-width: 2
 * js-indent-level: 2
 * js2-basic-offset: 2
 * End:
 */
