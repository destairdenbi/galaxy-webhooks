from galaxy.managers import api_keys
from galaxy.webapps.galaxy.api.workflows import WorkflowsAPIController
from galaxy.webapps.galaxy.controllers.workflow import WorkflowController
from galaxy.managers.citations import CitationsManager
from galaxy.webapps.galaxy.controllers.history import HistoryController
from galaxy.managers.histories import HistoryManager
#from galaxy.webapps.galaxy.api.tours import ToursController

import logging
import re
log = logging.getLogger(__name__)

class Switchtour(object):
    def __init__(this, trans):
        this.trans = trans
        this.user = this.trans.user
        this.history = this.trans.get_history()
        this.history_id = this.trans.app.security.encode_id(this.history.id)
        this.tour = ''
        this.lasttool = ''
        this.bibtex = ''
        this.workflow = ''
        this.commands = ''

    def update_tours(this):
        this.trans.app.tour_registry.load_tours()
        #tc = ToursController(this.trans.app)
        #for t in this.trans.app.tour_registry.tours_by_id_with_description():
        #     tc.update_tour(this.trans, t['id'])
        
    def new_history(this):
        for h in HistoryManager(this.trans.app).by_user(this.user):
            if h.name == 'de.STAIR Guide History (non-persistent!)':
                HistoryManager(this.trans.app).purge(h)
        this.trans.set_history(this.trans.new_history(name='de.STAIR Guide History (non-persistent!)'))

    def get_all(this):
        this.get_commands()
        this.get_workflow()
        this.get_bibtex()

        return {
            'commands': this.commands,
            'workflow': this.workflow,
            'bibtex': this.bibtex
        }

    def get_commands(this):
        for e in this.history.contents_iter():
            this.lasttool = e.creating_job.get_tool_id()

            if (this.lasttool == 'upload1') or (e.creating_job.check_if_output_datasets_deleted() is True):
                continue

            if (e.creating_job.exit_code == 'none') or (e.creating_job.exit_code == 0):
                this.commands = this.commands + "\n" + e.creating_job.get_command_line() if this.commands else e.creating_job.get_command_line()

        return {
            'commands': this.commands
        }


    def get_workflow(this):
        job_ids = []
        for e in this.history.contents_iter():
            if (e.creating_job.exit_code == 'none') or (e.creating_job.exit_code == 0):
                job_ids.append(this.trans.app.security.encode_id(e.creating_job.id))

        for w in this.trans.sa_session.query(this.trans.app.model.StoredWorkflow).filter_by(user=this.user, name='de.STAIR Guide Workflow (non-persistent!)', deleted=False).all():
            try:
                WorkflowController(this.trans.app).delete(this.trans, id=this.trans.app.security.encode_id(w.id))
            except:
                pass

        if job_ids:
            WorkflowsAPIController(this.trans.app).create(this.trans, {'from_history_id': this.history_id, 'workflow_name': 'de.STAIR Guide Workflow (non-persistent!)', 'job_ids': job_ids, 'dataset_ids': [], 'dataset_collection_ids': []})

            w = this.trans.sa_session.query(this.trans.app.model.StoredWorkflow).filter_by(user=this.user, deleted=False).all()[0]

            this.workflow = WorkflowController(this.trans.app).for_direct_import(this.trans,this.trans.app.security.encode_id(w.id))

        return {
            'workflow': this.workflow
        }


    def get_bibtex(this):
        citations = []
        for e in this.history.contents_iter():
            this.lasttool = e.creating_job.get_tool_id()
            if (e.creating_job.check_if_output_datasets_deleted() is True):
                continue

            b = CitationsManager(this.trans.app).citations_for_tool_ids([this.lasttool])
            
            if b:
                bib = b[0].to_bibtex()
                if b[0].has_doi and re.search(r'title\s*=\s*\{.+', bib) is None:
                    try:
                        if isinstance(b[0], DoiCitation):
                            tmp = CitationsManager(this.trans.app).doi_cache.get_bibtex(b[0].doi())
                            bib = tmp
                        else:
                            doi = re.search(r'doi\s*=\s*\{(.+)\}', b).group(1)
                            tmp = CitationsManager(this.trans.app).doi_cache.get_bibtex(doi)
                            bib = tmp
                    except:
                        pass
                bib = bib.lstrip()
                if not bib in citations:
                    this.bibtex = this.bibtex + "\n\n" + bib
        return {
            'bibtex': this.bibtex
        }

def main(trans, webhook, params):

    error = ''

    try:
        #apikey = api_keys.ApiKeyManager(trans.app).get_or_create_api_key(trans.user) # else not logged in error

        switchtour = Switchtour(trans)

        if params['fun']:
            function = getattr(switchtour,params['fun'])
            return {'success': not error, 'error': error, 'data': function()}

    except Exception as e:
        error = str(e)
        log.exception(e)

    return {'success': not error, 'error': error}
