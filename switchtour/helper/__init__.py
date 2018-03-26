import logging

log = logging.getLogger(__name__)

def main(trans, webhook):

    error = ''
    try:
        from bioblend import galaxy
        # import cStringIO
        # import json
        # import re
        from galaxy.webapps.galaxy.api.workflows import WorkflowsAPIController
        from galaxy.managers.users import UserManager
        # from galaxy.webapps.galaxy.api.tours import ToursController
    except ImportError as e:
        error = str(e)
        print(error)
        return {'success': not error, 'error': error}

    workflow = ''
    lasttool = ''
    commands = ''
    try:
        print("trans========================")
        # print(dir(trans.user))
        # trans.sa_session.query(trans.app.model.APIKeys)
        # trans.sa_session.query(trans.app.model.Histories)
        
        #apikey = trans.user.api_keys[0].key
        apikey = UserManager(trans.app).get_or_create_valid_api_key(trans.user).key
        gi = ''
        try:
            gi = galaxy.GalaxyInstance(url='http://127.0.0.1:80', key=apikey)
            gi.workflows.get_workflows()
        except Exception:
            gi = galaxy.GalaxyInstance(url='http://127.0.0.1:8080', key=apikey)
        
        for i in gi.workflows.get_workflows():
            gi.workflows.delete_workflow(i['id'])

        print("history========================")
        has_hastories = False
        job_ids = []
        history = trans.get_history() # trans.get_most_recent_history()
        history_id = trans.app.security.encode_id(history.id)
        # history.active_datasets
        # history.active_dataset_collections
        for i in history.contents_iter():
            if i.creating_job.check_if_output_datasets_deleted() == True:
                continue
            # i.creating_job.input_datasets
            # i.creating_job.output_datasets
            lasttool = i.creating_job.get_tool_id()
            if lasttool == 'upload1':
                continue
            job_ids.append(trans.app.security.encode_id(i.creating_job.get_id()))
            commands = commands + "\n" + i.creating_job.get_command_line() if commands else i.creating_job.get_command_line()
            has_hastories = True

        print "workflow========================"

        WorkflowsAPIController(trans.app).create(trans, {'from_history_id': history_id, 'workflow_name': 'tmp', 'job_ids': job_ids, 'dataset_ids': [], 'dataset_collection_ids': []})
        # w = json.loads(WorkflowsAPIController(trans.app).create(trans, {'from_history_id': history_id, 'workflow_name': 'tmp', 'job_ids': job_ids, 'dataset_ids': [], 'dataset_collection_ids': []}))
        # workflow = WorkflowsAPIController(trans.app).workflow_dict(trans, w['id']) # needs to remove escaping slahes
        workflow = gi.workflows.export_workflow_json(gi.workflows.get_workflows()[0]['id'])

        # if has_hastories :
            # jeha_id = gi.histories.export_history(history_id, gzip=False, include_hidden=False, include_deleted=False, wait=True)
            # download = cStringIO.StringIO()
            # gi.histories.download_history(history_id, jeha_id, download, chunk_size=4096)
            # workflow = download.getvalue()

        # print "tours========================"
        # for i in json.loads(ToursController(trans.app).index(trans)):
        #     m = re.search('tour_(\d+)',i['id'])
        #     if m:
        #         print m.group(1)

        if has_hastories and lasttool == 'nuke':
            for i in gi.histories.get_histories():
                gi.histories.delete_history(i['id'], purge=True)
            for i in gi.workflows.get_workflows():
                gi.workflows.delete_workflow(i['id'])

    except Exception as e:
        print str(e)

    return {'success': not error, 'error': error, 'lasttour': lasttool, 'workflow': workflow, 'commands': commands}
