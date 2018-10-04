import logging
import time

log = logging.getLogger(__name__)

def main(trans, webhook):

    error = ''
    try:
        from bioblend import galaxy
        from galaxy.webapps.galaxy.api.workflows import WorkflowsAPIController
        from galaxy.managers import api_keys
    except ImportError as e:
        error = str(e)
        print(error)
        return {'success': not error, 'error': error}

    finished = 1
    workflow = ''
    lasttool = ''
    commands = ''
    try:
        # print(dir(api_keys))
        apikey = api_keys.ApiKeyManager(trans.app).get_or_create_api_key(trans.user)
        gi = ''
        try:
            gi = galaxy.GalaxyInstance(url='http://127.0.0.1:80', key=apikey)
            gi.workflows.get_workflows()
        except Exception:
            gi = galaxy.GalaxyInstance(url='http://127.0.0.1:8080', key=apikey)
        
        history = trans.get_history() # trans.get_most_recent_history()
        history_id = trans.app.security.encode_id(history.id)
        job_ids = []

        for i in history.contents_iter():
            if i.creating_job.check_if_output_datasets_deleted() == True:
                continue
            lasttool = i.creating_job.get_tool_id()
            #print(i.creating_job.get_state()) #running #ok
            #print(i.creating_job.exit_code)   #none    #0
            if i.creating_job.finished is False:
                finished = 0
            if lasttool == 'upload1':
                continue
            job_ids.append(trans.app.security.encode_id(i.creating_job.get_id()))
            commands = commands + "\n" + i.creating_job.get_command_line() if commands else i.creating_job.get_command_line()

        for i in gi.workflows.get_workflows():
            gi.workflows.delete_workflow(i['id'])
        
        WorkflowsAPIController(trans.app).create(trans, {'from_history_id': history_id, 'workflow_name': 'tmp', 'job_ids': job_ids, 'dataset_ids': [], 'dataset_collection_ids': []})
        workflow = gi.workflows.export_workflow_json(gi.workflows.get_workflows()[0]['id'])
        # w = json.loads(WorkflowsAPIController(trans.app).create(trans, {'from_history_id': history_id, 'workflow_name': 'tmp', 'job_ids': job_ids, 'dataset_ids': [], 'dataset_collection_ids': []}))
        # workflow = WorkflowsAPIController(trans.app).workflow_dict(trans, w['id']) # needs to remove escaping slahes
        
        # if NUKE:
        #     for i in gi.histories.get_histories():
        #         gi.histories.delete_history(i['id'], purge=True)
        #     for i in gi.workflows.get_workflows():
        #         gi.workflows.delete_workflow(i['id'])

    except Exception as e:
        error = str(e)
        print(error)
        return {'success': not error, 'error': error}

    return {'success': not error, 'error': error, 'lasttour': lasttool, 'workflow': workflow, 'commands': commands, 'finished': finished}
