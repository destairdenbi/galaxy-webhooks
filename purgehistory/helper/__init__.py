import logging

log = logging.getLogger(__name__)

def main(trans, webhook):

    error = ''
    try:
        # from bioblend import galaxy
        from galaxy.managers import api_keys
        from galaxy.webapps.galaxy.controllers.history import HistoryController
        from galaxy.webapps.galaxy.controllers.workflow import WorkflowController
        from galaxy.managers.histories import HistoryManager
        # from galaxy.managers.workflows import WorkflowsManager
    except ImportError as e:
        error = str(e)
        print(error)
        return {'success': not error, 'error': error}

    try:
        apikey = api_keys.ApiKeyManager(trans.app).get_or_create_api_key(trans.user)
        # gi = ''
        # try:
        #     gi = galaxy.GalaxyInstance(url='http://127.0.0.1:80', key=apikey)
        #     gi.workflows.get_workflows()
        # except Exception:
        #     gi = galaxy.GalaxyInstance(url='http://127.0.0.1:8080', key=apikey)

        # for h in gi.histories.get_histories():
        #     gi.histories.delete_history(h['id'], purge=True)
        for h in HistoryManager(trans.app).by_user(trans.user):
            if h.name == 'de.STAIR workflow generator':
            	HistoryManager(trans.app).purge(h)
	            # HistoryController(trans.app).delete(trans, trans.app.security.encode_id(h.id), purge=True)
    	        # HistoriesController(trans.app).delete(trans, trans.app.security.encode_id(h.id), {'purge': True})
        #causes error: HistoryController(trans.app).purge_deleted_datasets(trans)

	    # for i in gi.workflows.get_workflows():
        #     gi.workflows.delete_workflow(i['id'])
        for w in trans.sa_session.query(trans.app.model.StoredWorkflow).filter_by(user=trans.user, deleted=False).all():
            WorkflowController(trans.app).delete(trans, id=trans.app.security.encode_id(w.id))

    except Exception as e:
        error = str(e)
        print(error)
        return {'success': not error, 'error': error}

    return {'success': not error, 'error': error}
