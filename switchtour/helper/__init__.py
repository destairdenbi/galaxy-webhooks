import logging

log = logging.getLogger(__name__)

def main(trans, webhook):

	error = ''
	try:
		from bioblend import galaxy
		import cStringIO
	except ImportError as e:
		error = str(e)
		print(error)
		return {'success': not error, 'error': error}

	user = ''
	lasttool = ''
	download = cStringIO.StringIO()
	try:
		# just to check if user is logged in, else throw error
		user = trans.user.username

		print("currentuser========================")
		print(dir(trans.user))
		print(trans.user.email)
		print(trans.user.active) #true
		for i in trans.user.api_keys:
			apikey = i.key
			print(i.key)
		print("history========================")
                # # Retrieve the galaxy_session id via the unique session_key
                # galaxy_session = self.sa_session.query(self.app.model.GalaxySession) \
                #                                 .filter(and_(self.app.model.GalaxySession.table.c.session_key == session_key,
                #                                              self.app.model.GalaxySession.table.c.is_valid == true())).options(joinedload("user")).first()

		has_hastories = False
		for i in trans.user.active_histories:
			has_hastories = True
			print(dir(i))
			print(i.to_dict())
			for c in i.contents_iter():
				print(dir(c))
				print(c.to_dict())
				lasttool = c.name
		print("alluser========================")
		for i in trans.sa_session.query(trans.app.model.APIKeys):
			print(i.id)
			print(i.user.username)
			print(i.user.email)
			print(i.key)

		print("bioblend========================")
		
		if has_hastories :
			gi = galaxy.GalaxyInstance(url='http://127.0.0.1:8080', key=apikey)
			history = gi.histories.get_most_recently_used_history()
			jeha_id = gi.histories.export_history(history['id'], gzip=False, include_hidden=False, include_deleted=False, wait=True)
			gi.histories.download_history(history['id'], jeha_id, download, chunk_size=4096)
			# print(download.getvalue())	
		
		print("========================")

		#TODO
		if has_hastories and lasttool == 'prune':
			for history in gi.histories.get_histories():
				gi.histories.delete_history(history['id'], purge=True)
	
	except Exception as e:
		error = str(e)
		print(error)
	return {'success': not error, 'error': error, 'lasttour': lasttool, 'history': download.getvalue()}

