import logging
import re

log = logging.getLogger(__name__)

def main(trans, webhook):

    error = ''
    try:
        # from bioblend import galaxy
        from galaxy.managers import api_keys
        from galaxy.webapps.galaxy.api.workflows import WorkflowsAPIController
        from galaxy.webapps.galaxy.controllers.workflow import WorkflowController
        # from galaxy.webapps.galaxy.api.histories import HistoriesController
        from galaxy.managers.citations import CitationsManager
        # from galaxy.managers.workflows import WorkflowsManager
    except ImportError as e:
        error = str(e)
        print(error)
        return {'success': not error, 'error': error}
    
    finished = 1
    workflow = ''
    lasttool = ''
    commands = ''
    bibtex = ''
    try:
        apikey = api_keys.ApiKeyManager(trans.app).get_or_create_api_key(trans.user) # else not logged in error
        # gi = ''
        # try:
        #     gi = galaxy.GalaxyInstance(url='http://127.0.0.1:80', key=apikey)
        #     gi.workflows.get_workflows()
        # except Exception:
        #     gi = galaxy.GalaxyInstance(url='http://127.0.0.1:8080', key=apikey)

        history = trans.get_history()
        history_id = trans.app.security.encode_id(history.id)
        job_ids = []
        citations = []
        	
        for i in history.contents_iter():
            if i.creating_job.finished is False:
                finished = 0
            lasttool = i.creating_job.get_tool_id()

            b = CitationsManager(trans.app).citations_for_tool_ids([lasttool])
            if b:
                bib = b[0].to_bibtex()
                if b[0].has_doi and re.search(ur'title\s*=\s*\{.+',bib) is None:
                    try:
                        if isinstance(b[0], DoiCitation):
                            tmp = CitationsManager(trans.app).doi_cache.get_bibtex(b[0].doi())
                            bib = tmp
                        else:
                            doi = re.search(ur'doi\s*=\s*\{(.+)\}',b).group(1)
                            tmp = CitationsManager(trans.app).doi_cache.get_bibtex(doi)
                            bib = tmp
                    except Exception:
                        pass
                bibtex = bibtex + "\n" + bib
                
            if (lasttool == 'upload1') or (i.creating_job.check_if_output_datasets_deleted() is True):
                continue

            #print(i.creating_job.get_state()) #running #ok #failed?
            #print(i.creating_job.exit_code)   #none    #0
            if (i.creating_job.exit_code == 'none') or (i.creating_job.exit_code == 0):
                job_ids.append(trans.app.security.encode_id(i.creating_job.get_id()))
                commands = commands + "\n" + i.creating_job.get_command_line() if commands else i.creating_job.get_command_line()

        # bibtex = HistoriesController(trans.app).citations(trans, history_id) # needs to be parsed

        # for i in gi.workflows.get_workflows():
        for w in trans.sa_session.query(trans.app.model.StoredWorkflow).filter_by(user=trans.user, deleted=False).all():
            WorkflowController(trans.app).delete(trans, id=trans.app.security.encode_id(w.id))
            #WorkflowsAPIController(trans.app).delete(trans,i['id'])            
            #gi.workflows.delete_workflow(i['id'])
		
        WorkflowsAPIController(trans.app).create(trans, {'from_history_id': history_id, 'workflow_name': 'de.STAIR workflow', 'job_ids': job_ids, 'dataset_ids': [], 'dataset_collection_ids': []})
        # ? WorkflowController(trans.app).build_from_current_history(trans,job_ids=job_ids,dataset_ids=[],workflow_name='de.STAIR workflow')
        # ? WorkflowController(trans.app).create(trans,workflow_name='de.STAIR workflow')
        
        w = trans.sa_session.query(trans.app.model.StoredWorkflow).filter_by(user=trans.user, deleted=False).all()[0]
        #workflow = gi.workflows.export_workflow_json(trans.app.security.encode_id(w.id))
        #workflow = gi.workflows.export_workflow_json(gi.workflows.get_workflows()[0]['id'])
        #workflow = WorkflowController(trans.app).export_to_file(trans,trans.app.security.encode_id(w.id))
        # workflow = WorkflowsAPIController(trans.app).workflow_dict(trans, w['id']) # ! needs to be parsed
        workflow = WorkflowController(trans.app).for_direct_import(trans,trans.app.security.encode_id(w.id))

    except Exception as e:
        error = str(e)
        print(error)
        return {'success': not error, 'error': error}

    return {'success': not error, 'error': error, 'lasttour': lasttool, 'workflow': workflow, 'commands': commands, 'finished': finished, 'bibtex': bibtex}
