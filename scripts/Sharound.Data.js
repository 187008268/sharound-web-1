/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/*Implement adding a document: The code below adds a new document to the items collection. The document data comes from a plain JavaScript object. We do this by first getting a reference to a Cloud Firestore collection items then add'ing the data. */

Sharound.prototype.addItem = function(data) {
  var collection = firebase.firestore().collection('items');
  return collection.add(data);
};

/*Retrieve list of items: In the code below, we construct a query which will retrieve up to 50 items from the top-level collection named items, which are ordered by the average rating (currently all zero). After we declared this query, we pass it to the getDocumentsInQuery() method which is responsible for loading and rendering the data. */
Sharound.prototype.getAllItems = function(renderer) {
  var query = firebase.firestore()
      .collection('items')
      .orderBy('avgRating', 'desc')
      .limit(50);

  this.getDocumentsInQuery(query, renderer);
};

/* Render all documents in the provided query:   

In the code below, query.onSnapshot will trigger its callback every time there's a change to the result of the query.

The first time, the callback is triggered with the entire result set of the query -- meaning the whole items collection from Cloud Firestore. It then passes all the individual documents to the renderer.display function.
When a document is deleted, change.type equals to removed. So in this case, we'll call a function that removes the item from the UI.

*/
Sharound.prototype.getDocumentsInQuery = function(query, renderer) {
  query.onSnapshot(function(snapshot) {
    if (!snapshot.size) return renderer.empty(); // Display "There are no items".

    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        renderer.remove(change.doc);
      } else {
        renderer.display(change.doc);
      }
    });
  });
};

/* Retrieve a single item 
After you've implemented this method, you'll be able to view pages for each item. Just click on a item in the list and you should see the item's details page
*/
Sharound.prototype.getItem = function(id) {
  return firebase.firestore().collection('items').doc(id).get();
};

/*     Retrieve filtered list of items   */
Sharound.prototype.getFilteredItems = function(filters, renderer) {
  var query = firebase.firestore().collection('items');

  if (filters.category !== 'Any') {
    query = query.where('category', '==', filters.category);
  }

  if (filters.city !== 'Any') {
    query = query.where('city', '==', filters.city);
  }

  if (filters.price !== 'Any') {
    query = query.where('price', '==', filters.price.length);
  }

  if (filters.sort === 'Rating') {
    query = query.orderBy('avgRating', 'desc');
  } else if (filters.sort === 'Reviews') {
    query = query.orderBy('numRatings', 'desc');
  }

  this.getDocumentsInQuery(query, renderer);
};

/* Retrieve add a rating to a item */
Sharound.prototype.addRating = function(itemID, rating) {
  var collection = firebase.firestore().collection('items');
  var document = collection.doc(itemID);
  var newRatingDocument = document.collection('ratings').doc();

  return firebase.firestore().runTransaction(function(transaction) {
    return transaction.get(document).then(function(doc) {
      var data = doc.data();

      var newAverage =
          (data.numRatings * data.avgRating + rating.rating) /
          (data.numRatings + 1);

      transaction.update(document, {
        numRatings: data.numRatings + 1,
        avgRating: newAverage
      });
      return transaction.set(newRatingDocument, rating);
    });
  });
};
