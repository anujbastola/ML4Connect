from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import pandas as pd 

tfidf = 0
cosine_sim=0

metadata = pd.read_csv('compare.csv', low_memory=False)
print(metadata['speciality'].head())
from sklearn.feature_extraction.text import TfidfVectorizer
tfidf = TfidfVectorizer()
metadata['speciality'] = metadata['speciality'].fillna('')
tfidf_matrix = tfidf.fit_transform(metadata['speciality'])

print(tfidf_matrix.shape)
from sklearn.metrics.pairwise import linear_kernel
cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)
indices = pd.Series(metadata.index, index=metadata['speciality']).drop_duplicates()

def get_recommendations(title, cosine_sim=cosine_sim):
	idx = indices[title]
	sim_scores = list(enumerate(cosine_sim[idx]))
	sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
	sim_scores = sim_scores[1:4]
	indicess = [i[0] for i in sim_scores]
	return metadata['email'].iloc[indicess]

a = metadata['speciality'].iloc[0]
b= get_recommendations(a)
print(b)
b_vals =[]
for one in b:
	print(one)
	b_vals.append(one)

import psycopg2
from urllib.parse import urlparse, uses_netloc
import configparser

config = configparser.ConfigParser()
config.read('config.ini')
connection_string = config['database']['postgres_connection']
uses_netloc.append("postgres")
url = urlparse(connection_string)
global conn
conn = psycopg2.connect(database=url.path[1:],
		user=url.username,
		password=url.password,
		host=url.hostname,
		port=url.port)

with conn.cursor() as curs:
	curs.execute('CREATE TABLE IF NOT EXISTS UserAssociateDoctor (UserEmail Varchar(50), FirstDoctor Varchar(50), SecondDoctor Varchar(50), ThirdDoctor Varchar(50))')
	conn.commit()



with conn.cursor() as curs:
	curs.execute('SELECT email, range, InputText from Users')
	for one in curs:
		req_email = str(one[0])
		req_range = str(one[1])
		inputtext=str(one[2])
	conn.commit()

usertodoctors = {}
usertodoctors[req_email] = []
for one in b:
	usertodoctors[req_email].append(one)

with conn.cursor() as cur:
	cur.execute('INSERT INTO UserAssociateDoctor (UserEmail, FirstDoctor, SecondDoctor,ThirdDoctor) VALUES (%s,%s,%s,%s)',(req_email, b_vals[0], b_vals[1],b_vals[2]))
	conn.commit()

print(usertodoctors)






'''

def allseriouslydepressedwords(list_seriously_depressed, words_seriously_depressed):
	for one in list_seriously_depressed:
		words_seriously_depressed+=str(one[2])
	return words_seriously_depressed

def allmoderatedepressedwords(list_moderately_depressed, words_moderately_depressed):
	for one in list_moderately_depressed:
		words_moderately_depressed+=str(one[2])
	return words_moderately_depressed
'''
'''
def allcontentwords(list_content, words_content):
	for one in list_content:
		words_content+=str(one[2])
	return words_content

def allhappywords(list_happy, words_happy):
	for one in list_happy:
		words_happy+=str(one[2])
	return words_happy

def tfidf_happywords(allwords):
	tfidf = TfidfVectorizer()
	#print("INSIDE TFIDF HAPPY")
	allwords = allwords.split()
	#allwords =[a.lower() for a in allwords]
	#print(allwords)
	tfidf_matrix_happy = tfidf.fit_transform(allwords)
	cosine_sim = list(enumerate(linear_kernel(tfidf_matrix_happy[0:1], tfidf_matrix_happy).flatten()))
	print(cosine_sim)


	

	return tfidf_matrix_happy
	#print(tfidf_matrix_happy.shape)
	#print (tfidf_matrix_happy.shape())

def tfidf_contentwords(allwords):
	#print("INSIDE TFIDF CONTENT WORDS")
	#print(allwords)
	tfidf = TfidfVectorizer()
	
	allwords=allwords.split()
	tfidf_matrix_content = tfidf.fit_transform(allwords)
	cosine_sim = linear_kernel(tfidf_matrix_content, tfidf_matrix_content)
	return tfidf_matrix_content


def tfidf_moderately_depressed(allwords):
	allwords=allwords.split()
	tfidf = TfidfVectorizer()
	
	tfidf_matrix_moderately_depressed = tfidf.fit_transform(allwords)
	cosine_sim = linear_kernel(tfidf_matrix_moderately_depressed, tfidf_matrix_moderately_depressed)
	return tfidf_matrix_moderately_depressed

def tfidf_seriously_depressed(allwords):
	allwords = allwords.split()
	tfidf = TfidfVectorizer()
	
	tfidf_matrix_seriously_depressed = tfidf.fit_transform(allwords)
	cosine_sim = linear_kernel(tfidf_matrix_seriously_depressed, tfidf_matrix_seriously_depressed)
	return tfidf_matrix_seriously_depressed
'''

'''
'''
'''
def mapping():


	def connect_to_db():
		inputtext = ""
		import psycopg2
		from urllib.parse import urlparse, uses_netloc
		import configparser

		config = configparser.ConfigParser()
		config.read('config.ini')
		connection_string = config['database']['postgres_connection']
		uses_netloc.append("postgres")
		url = urlparse(connection_string)
		global conn
		conn = psycopg2.connect(database=url.path[1:],
			user=url.username,
			password=url.password,
			host=url.hostname,
			port=url.port)
		with conn.cursor() as curs:
			curs.execute('SELECT email, name, speciality from Psychiatrist WHERE Range=%s', ("Severely Depressed",))
			for one in curs:
				list_severely_depressed.append(list(one))

		with conn.cursor() as curs:
			curs.execute('SELECT email, name, speciality from Psychiatrist WHERE Range=%s', ("Moderate Depressed",))
			for one in curs:
				list_moderately_depressed.append(list(one))

		with conn.cursor() as curs:
			curs.execute('SELECT email, name, speciality from Psychiatrist WHERE Range=%s', ("Content",))
			for one in curs:
				list_content.append(list(one))

		with conn.cursor() as curs:
			curs.execute('SELECT email, name, speciality from Psychiatrist WHERE Range=%s', ("Happy",))
			for one in curs:
				list_happy.append(list(one))
					
		with conn.cursor() as curs:
			curs.execute('SELECT range, InputText from Users')
			for one in curs:
				req_range = str(one[0])
				inputtext+=str(one[1])

		print(inputtext)
		print("REQUIRED RANGE: ")
		print(req_range)

#	
		words_happy = ""
		words_moderately_depressed = ""
		words_seriously_depressed=""
	
		#print(list_happy)
		if (req_range == "Happy" and len(list_happy)!=0):
			all_happy_words = allhappywords(list_happy, words_happy)
			print("ALL HAPPY WORDS")
			print(all_happy_words)
			inputtext+=all_happy_words
			
			print(inputtext)
			#print("SENDING TO tfidf_happywords")
			#print(all_happy_words)
			#print("THIS IS ALL HAPPY WORDS BEING SENT TO TFIDF")
			req_tfidf= tfidf_happywords(inputtext)
			#get_similarity(inputtext, req_tfidf )
			#print(all_happy_words)

		elif (req_range == "Content" and len(list_content)!=0):
			words_content = ""
			all_content_words = allcontentwords(list_content,words_content)
			inputtext+=all_content_words
			#all_content_words+=inputtext
			#print("THIS IS ALL CONTENT WORDS BEING SENT TO TFIDF")
			#print(all_content_words)
			req_tfidf= tfidf_contentwords(inputtext)
			#get_similarity(inputtext, req_tfidf )

		
		elif (req_range == "Moderate Depressed" and len(list_moderately_depressed)!=0):

			all_words_moderately_depressed = allmoderatedepressedwords(list_moderately_depressed, words_moderately_depressed)
			inputtext+=all_words_moderately_depressed
			#all_words_moderately_depressed+=inputtext
			req_tfidf = tfidf_moderately_depressed(inputtext)
			#get_similarity(inputtext, req_tfidf )

		elif (req_range =="Severely Depressed" and len(list_severely_depressed)!=0):
			all_words_seriously_depressed = allseriouslydepressedwords(list_severely_depressed, words_seriously_depressed)
			inputtext+=all_words_seriously_depressed
			#all_words_seriously_depressed+=inputtext
			req_tfidf =tfidf_seriously_depressed(inputtext)
			#get_similarity(inputtext, req_tfidf )


	connect_to_db()
mapping()

'''
